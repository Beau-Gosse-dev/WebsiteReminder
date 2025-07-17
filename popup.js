/**
 * @file popup.js
 * @description Handles the logic for the extension's popup UI.
 * Manages saving, deleting, and displaying reminders and global settings.
 */

document.addEventListener('DOMContentLoaded', function() {
  // --- DOM Elements ---
  const saveButton = document.getElementById('save');
  const websiteInput = document.getElementById('website');
  const reminderInput = document.getElementById('reminder');
  const delayInput = document.getElementById('delay');
  const cooldownInput = document.getElementById('cooldown');
  const statusDiv = document.getElementById('status');
  const remindersList = document.getElementById('reminders-list');

  // --- Functions ---

  /**
   * Loads all saved reminders from storage and displays them in the list.
   */
  async function loadReminders() {
    const items = await chrome.storage.sync.get(null);
    remindersList.innerHTML = '';
    for (const website in items) {
      if (website === 'globalCooldown') continue; // Skip global settings
      createReminderListItem(website, items[website]);
    }
  }

  /**
   * Creates and appends a list item for a single reminder.
   * @param {string} website The website URL (key).
   * @param {object} reminderData The reminder object { message, delay }.
   */
  function createReminderListItem(website, reminderData) {
    const listItem = document.createElement('li');
    
    let text = `${website}: ${reminderData.message}`;
    if (reminderData.delay) {
      text += ` (delay: ${reminderData.delay}s)`;
    }
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteReminder(website));

    listItem.appendChild(textSpan);
    listItem.appendChild(deleteButton);
    remindersList.appendChild(listItem);
  }

  /**
   * Deletes a specific reminder from storage and reloads the list.
   * @param {string} website The website key to delete.
   */
  function deleteReminder(website) {
    chrome.storage.sync.remove(website, loadReminders);
  }

  /**
   * Loads the global cooldown setting from storage.
   */
  async function loadGlobalSettings() {
    const { globalCooldown = 0 } = await chrome.storage.sync.get('globalCooldown');
    cooldownInput.value = globalCooldown;
  }

  /**
   * Saves a new reminder to storage.
   */
  function saveReminder() {
    const website = websiteInput.value.trim();
    const message = reminderInput.value.trim();
    const delay = parseInt(delayInput.value, 10) || 0;

    if (website && message) {
      const reminderData = { message, delay };
      chrome.storage.sync.set({ [website]: reminderData }, () => {
        statusDiv.textContent = 'Reminder saved!';
        websiteInput.value = '';
        reminderInput.value = '';
        delayInput.value = '';
        loadReminders();
        setTimeout(() => { statusDiv.textContent = ''; }, 2000);
      });
    }
  }

  /**
   * Saves the global cooldown setting to storage.
   */
  function saveGlobalSettings() {
    const cooldown = parseInt(cooldownInput.value, 10) || 0;
    chrome.storage.sync.set({ globalCooldown: cooldown });
  }

  // --- Event Listeners ---
  saveButton.addEventListener('click', saveReminder);
  cooldownInput.addEventListener('change', saveGlobalSettings);

  // --- Initial Load ---
  loadReminders();
  loadGlobalSettings();
});
