/**
 * @file content.js
 * @description Injected into pages to display the reminder modal.
 * Handles the display, timer, and user interaction for the reminder.
 */

// --- Listener ---

/**
 * Listens for messages from the background script to show a reminder.
 * A global flag is used to prevent multiple listeners from being attached.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (window.hasWebsiteReminderListener) return;
  window.hasWebsiteReminderListener = true;

  if (document.getElementById('website-reminder-backdrop')) return;

  createReminderModal(request.reminder, request.website);
});

// --- DOM Creation ---

/**
 * Creates and displays the full-screen reminder modal.
 * @param {object} reminderData The reminder object { message, delay }.
 * @param {string} website The website key for the reminder.
 */
function createReminderModal(reminderData, website) {
  const { message, delay = 0 } = reminderData;

  const backdrop = document.createElement('div');
  backdrop.id = 'website-reminder-backdrop';

  const reminderDiv = document.createElement('div');
  reminderDiv.id = 'website-reminder';

  const reminderText = document.createElement('p');
  reminderText.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.id = 'close-reminder';

  reminderDiv.appendChild(reminderText);
  reminderDiv.appendChild(closeButton);
  backdrop.appendChild(reminderDiv);

  document.body.appendChild(backdrop);

  manageCloseButtonState(closeButton, delay, website);
}

// --- Button Logic ---

/**
 * Manages the state of the close button, including the countdown timer.
 * @param {HTMLButtonElement} closeButton The button element to manage.
 * @param {number} initialDelay The countdown duration in seconds.
 * @param {string} website The website key for the reminder.
 */
function manageCloseButtonState(closeButton, initialDelay, website) {
  let currentDelay = initialDelay;

  function update() {
    if (currentDelay > 0) {
      closeButton.disabled = true;
      closeButton.textContent = `Close (${currentDelay}s)`;
      currentDelay--;
      setTimeout(update, 1000);
    } else {
      closeButton.disabled = false;
      closeButton.textContent = 'Close';
    }
  }

  closeButton.addEventListener('click', () => {
    if (!closeButton.disabled) {
      chrome.runtime.sendMessage({ type: 'reminderClosed', website: website });
      document.getElementById('website-reminder-backdrop').remove();
      window.hasWebsiteReminderListener = false; // Reset listener flag
    }
  });

  // Clean up the listener flag if the user navigates away
  window.addEventListener('beforeunload', () => {
    window.hasWebsiteReminderListener = false;
  });

  update();
}
