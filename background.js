/**
 * @file background.js
 * @description Service worker for the Website Reminder extension.
 * Handles checking for reminders on tab updates and managing the cooldown timer.
 */

// --- Listeners ---

/**
 * Listens for messages from content scripts.
 * Specifically, handles the 'reminderClosed' message to update the cooldown timer.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'reminderClosed' && request.website) {
    updateLastShownTimestamp(request.website);
  }
});

/**
 * Listens for tab updates to trigger reminder checks.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkUrlForReminders(tab);
  }
});

// --- Core Logic ---

/**
 * Checks the URL of the updated tab against all saved reminders.
 * @param {chrome.tabs.Tab} tab The tab that was just updated.
 */
async function checkUrlForReminders(tab) {
  const { globalCooldown = 0 } = await chrome.storage.sync.get('globalCooldown');
  const items = await chrome.storage.sync.get(null);

  for (const website in items) {
    if (website === 'globalCooldown') continue;

    if (tab.url.includes(website)) {
      const lastShownKey = `lastShown_${website}`;
      const { [lastShownKey]: lastShown = 0 } = await chrome.storage.local.get(lastShownKey);
      const now = new Date().getTime();

      if (now - lastShown > globalCooldown * 60 * 1000) {
        showReminderInTab(tab.id, items[website], website);
      }
    }
  }
}

/**
 * Injects the content script and sends the reminder data to the tab.
 * @param {number} tabId The ID of the tab to show the reminder in.
 * @param {object} reminderData The reminder object containing the message and delay.
 * @param {string} website The website key for the reminder.
 */
function showReminderInTab(tabId, reminderData, website) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.js']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error(`Error injecting script: ${chrome.runtime.lastError.message}`);
      return;
    }
    chrome.tabs.sendMessage(tabId, { reminder: reminderData, website: website });
  });
}

/**
 * Updates the timestamp for when a reminder was last shown for a specific website.
 * @param {string} website The website key for the reminder.
 */
function updateLastShownTimestamp(website) {
  const lastShownKey = `lastShown_${website}`;
  const now = new Date().getTime();
  chrome.storage.local.set({ [lastShownKey]: now });
}
