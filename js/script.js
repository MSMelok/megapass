// MegaPass - Daily Wi-Fi Password Generator
// Created by Muhammad Salah - MelokMade

// Constants
const STORAGE_KEYS = {
  PASSWORDS: 'megapass_passwords',
  HISTORY: 'megapass_history',
  THEME: 'megapass_theme',
  DIGIT_PREFERENCE: 'megapass_digit_preference',
  SSID: 'megapass_ssid'
};

const DEFAULT_SSID = 'CTOS';
const ACTION_TYPES = {
  GENERATE: 'generate',
  MANUAL: 'manual',
  COPY: 'copy',
  THEME: 'theme_change',
  DIGIT: 'digit_change',
  SSID: 'ssid_change',
  RESET: 'reset'
};

// DOM Elements
const themeSwitch = document.getElementById('theme-switch');
const digitSwitch = document.getElementById('digit-switch');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const currentPasswordEl = document.getElementById('current-password');
const passwordHistoryEl = document.getElementById('password-history');
const qrCodeEl = document.getElementById('qr-code');
const toastEl = document.getElementById('toast');
const manualPasswordInput = document.getElementById('manual-password');
const setManualBtn = document.getElementById('set-manual-btn');
const ssidInput = document.getElementById('ssid-input');
const setSSIDBtn = document.getElementById('set-ssid-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');

// Tab Elements
const tabMain = document.getElementById('tab-main');
const tabHistory = document.getElementById('tab-history');
const mainContent = document.getElementById('main-content');
const historyContent = document.getElementById('history-content');

// Custom dialog elements
const confirmDialog = document.getElementById('confirm-dialog');
const confirmMessage = document.getElementById('confirm-message');
const confirmOkBtn = document.getElementById('confirm-ok');
const confirmCancelBtn = document.getElementById('confirm-cancel');

// State Management
let passwords = []; // Array to store passwords for the current month
let actionHistory = []; // Array to store all actions and changes
let currentMonth = new Date().getMonth();
let isUsingFourDigits = false;
let ssidName = DEFAULT_SSID;

// Initialize the application
function initApp() {
  // Load saved preferences
  loadThemePreference();
  loadDigitPreference();
  
  // Load passwords and action history from localStorage or initialize
  loadPasswords();
  loadActionHistory();
  
  // Set up event listeners
  setupEventListeners();
  
  // Check if we need to generate a password for today
  checkTodaysPassword();
}

// Load theme preference from localStorage
function loadThemePreference() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  
  // Set dark theme as default if no preference is saved
  if (savedTheme === null || savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeSwitch.checked = true;
  } else if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    themeSwitch.checked = false;
  }
}

// Load digit preference from localStorage
function loadDigitPreference() {
  const digitPref = localStorage.getItem(STORAGE_KEYS.DIGIT_PREFERENCE);
  
  if (digitPref === 'four') {
    isUsingFourDigits = true;
    digitSwitch.checked = true;
  }
}

// Load SSID from localStorage
function loadSSID() {
  const savedSSID = localStorage.getItem(STORAGE_KEYS.SSID);
  return savedSSID || DEFAULT_SSID;
}

// Load passwords from localStorage
function loadPasswords() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
    
    if (storedData) {
      const data = JSON.parse(storedData);
      
      // Check if we need to reset passwords for a new month
      const savedMonth = data.month;
      if (savedMonth !== currentMonth) {
        // New month, reset passwords
        resetPasswords();
      } else {
        // Same month, load stored passwords
        passwords = data.passwords || [];
      }
    } else {
      // No data stored yet
      resetPasswords();
    }
  } catch (error) {
    console.error('Error loading passwords:', error);
    resetPasswords();
  }
  
  // Update the UI
  updatePasswordHistory();
}

// Load action history from localStorage
function loadActionHistory() {
  try {
    const storedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (storedHistory) {
      actionHistory = JSON.parse(storedHistory);
    } else {
      actionHistory = [];
    }
  } catch (error) {
    console.error('Error loading action history:', error);
    actionHistory = [];
  }
  
  // Update the history display
  updateHistoryDisplay();
}

// Save action history to localStorage
function saveActionHistory() {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(actionHistory));
}

// Log a new action to the history
function logAction(type, details) {
  const action = {
    timestamp: new Date().toISOString(),
    type: type,
    details: details
  };
  
  // Add to the beginning of the history array
  actionHistory.unshift(action);
  
  // Save to localStorage
  saveActionHistory();
  
  // Update the history display
  updateHistoryDisplay();
}

// Reset passwords for a new month
function resetPasswords() {
  passwords = [];
  savePasswords();
  
  // Log the reset action
  logAction(ACTION_TYPES.RESET, { 
    message: 'Monthly password history reset',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear()
  });
  
  showToast('Password history has been reset for the new month');
}

// Save passwords to localStorage
function savePasswords() {
  const data = {
    month: currentMonth,
    passwords: passwords
  };
  
  localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(data));
}

// Set up event listeners
function setupEventListeners() {
  // Theme toggle
  themeSwitch.addEventListener('change', toggleTheme);
  
  // Digit preference toggle
  digitSwitch.addEventListener('change', toggleDigitPreference);
  
  // Generate password button
  generateBtn.addEventListener('click', generatePassword);
  
  // Copy password button
  copyBtn.addEventListener('click', copyPasswordToClipboard);
  
  // Set manual password button
  setManualBtn.addEventListener('click', setManualPassword);
  
  // Listen for enter key on manual password input
  manualPasswordInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      setManualPassword();
    }
  });
  
  // Set SSID button
  setSSIDBtn.addEventListener('click', saveSSID);
  
  // Load SSID value into the input field
  ssidInput.value = loadSSID();
  
  // Listen for enter key on SSID input
  ssidInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      saveSSID();
    }
  });
  
  // Tab navigation controls
  tabMain.addEventListener('click', () => {
    tabMain.classList.add('active');
    tabHistory.classList.remove('active');
    mainContent.classList.remove('hidden');
    historyContent.classList.add('hidden');
  });
  
  tabHistory.addEventListener('click', () => {
    tabHistory.classList.add('active');
    tabMain.classList.remove('active');
    historyContent.classList.remove('hidden');
    mainContent.classList.add('hidden');
  });
  
  // Settings modal controls
  settingsBtn.addEventListener('click', openSettingsModal);
  closeSettingsBtn.addEventListener('click', closeSettingsModal);
  
  // Close modal when clicking outside
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  });
  
  // Close custom dialog when clicking outside
  confirmDialog.addEventListener('click', (e) => {
    if (e.target === confirmDialog) {
      confirmDialog.classList.add('hidden');
    }
  });
  
  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!settingsModal.classList.contains('hidden')) {
        closeSettingsModal();
      }
      if (!confirmDialog.classList.contains('hidden')) {
        confirmDialog.classList.add('hidden');
      }
    }
  });
}

// Toggle between light and dark theme
function toggleTheme() {
  const newTheme = themeSwitch.checked ? 'dark' : 'light';
  
  if (newTheme === 'dark') {
    document.body.classList.add('dark-theme');
    localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
  } else {
    document.body.classList.remove('dark-theme');
    localStorage.setItem(STORAGE_KEYS.THEME, 'light');
  }
  
  // Log the theme change
  logAction(ACTION_TYPES.THEME, {
    theme: newTheme,
    timestamp: new Date().toISOString()
  });
  
  showToast(`Theme switched to ${newTheme} mode`);
}

// Toggle between 3 and 4 digit password format
function toggleDigitPreference() {
  isUsingFourDigits = digitSwitch.checked;
  const digitFormat = isUsingFourDigits ? 'four' : 'three';
  
  localStorage.setItem(STORAGE_KEYS.DIGIT_PREFERENCE, digitFormat);
  
  // Log the digit preference change
  logAction(ACTION_TYPES.DIGIT, {
    format: digitFormat,
    timestamp: new Date().toISOString()
  });
  
  showToast(`Password format updated to ${digitFormat}-digit format`);
}

// Generate a new password
function generatePassword() {
  // Always generate a new password when the button is clicked, regardless of existing passwords
  
  // Generate a new unique password
  const newPassword = createUniquePassword();
  
  // Create a password entry with today's date
  const passwordEntry = {
    date: new Date().toISOString(),
    password: newPassword
  };
  
  // Add to the passwords array
  passwords.unshift(passwordEntry);
  
  // Save to localStorage
  savePasswords();
  
  // Log this action
  logAction(ACTION_TYPES.GENERATE, {
    password: newPassword,
    timestamp: new Date().toISOString(),
    isAutomatic: true
  });
  
  // Update UI
  displayCurrentPassword(newPassword);
  updatePasswordHistory();
  showToast('New password generated successfully!');
  
  // Enable buttons
  enablePasswordActions();
}

// Create a unique password that hasn't been used this month
function createUniquePassword() {
  let newPassword;
  let isUnique = false;
  
  while (!isUnique) {
    newPassword = generateRandomPassword();
    isUnique = !passwords.some(entry => entry.password === newPassword);
  }
  
  return newPassword;
}

// Generate a random password in the format Mega###* or Mega####*
function generateRandomPassword() {
  const digits = isUsingFourDigits ? 4 : 3;
  const randomNumber = Math.floor(Math.random() * Math.pow(10, digits));
  const formattedNumber = randomNumber.toString().padStart(digits, '0');
  
  return `Mega${formattedNumber}*`;
}

// Get password for today if it exists
function getPasswordForToday() {
  if (passwords.length === 0) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const latestPasswordEntry = passwords[0];
  const latestDate = new Date(latestPasswordEntry.date);
  latestDate.setHours(0, 0, 0, 0);
  
  if (latestDate.getTime() === today.getTime()) {
    return latestPasswordEntry.password;
  }
  
  return null;
}

// Check if we need to display today's password
function checkTodaysPassword() {
  const todayPassword = getPasswordForToday();
  
  if (todayPassword) {
    displayExistingPassword(todayPassword);
  }
}

// Display the existing password for today
function displayExistingPassword(password) {
  displayCurrentPassword(password);
  enablePasswordActions();
}

// Display the current password on the UI
function displayCurrentPassword(password) {
  currentPasswordEl.textContent = password;
  generateQRCode(password);
}

// Enable copy button
function enablePasswordActions() {
  copyBtn.disabled = false;
}

// Update the password history display
function updatePasswordHistory() {
  // Clear the history container
  passwordHistoryEl.innerHTML = '';
  
  if (passwords.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.classList.add('empty-state');
    emptyState.textContent = 'No passwords generated this month';
    passwordHistoryEl.appendChild(emptyState);
    return;
  }
  
  // Display each password entry
  passwords.forEach(entry => {
    const historyItem = document.createElement('div');
    historyItem.classList.add('history-item');
    
    const date = new Date(entry.date);
    const formattedDate = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    historyItem.innerHTML = `
      <span class="history-password">${entry.password}</span>
      <span class="history-date">${formattedDate} ${formattedTime}</span>
    `;
    
    passwordHistoryEl.appendChild(historyItem);
  });
}

// Update the action history display
function updateHistoryDisplay() {
  // The history tab shows both passwords and action logs in chronological order
  if (actionHistory.length === 0) {
    // If there's no history, we still show the passwords (handled by updatePasswordHistory)
    return;
  }
  
  // Add the action history items to the password history container
  actionHistory.forEach(action => {
    const historyItem = document.createElement('div');
    historyItem.classList.add('history-item', 'action-log');
    
    const date = new Date(action.timestamp);
    const formattedDate = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Get icon and color based on action type
    let icon, actionText;
    
    switch(action.type) {
      case ACTION_TYPES.GENERATE:
        icon = '<i class="fa-solid fa-key"></i>';
        actionText = `Generated password: ${action.details.password}`;
        break;
      case ACTION_TYPES.MANUAL:
        icon = '<i class="fa-solid fa-pen-to-square"></i>';
        actionText = `Manually set password: ${action.details.password}`;
        break;
      case ACTION_TYPES.COPY:
        icon = '<i class="fa-regular fa-clipboard"></i>';
        actionText = `Copied password: ${action.details.password}`;
        break;
      case ACTION_TYPES.THEME:
        icon = '<i class="fa-solid fa-palette"></i>';
        actionText = `Changed theme to ${action.details.theme}`;
        break;
      case ACTION_TYPES.DIGIT:
        icon = '<i class="fa-solid fa-hashtag"></i>';
        actionText = `Changed to ${action.details.format} digits`;
        break;
      case ACTION_TYPES.SSID:
        icon = '<i class="fa-solid fa-wifi"></i>';
        actionText = `Updated network name to "${action.details.ssid}"`;
        break;
      case ACTION_TYPES.RESET:
        icon = '<i class="fa-solid fa-trash-can"></i>';
        actionText = action.details.message;
        break;
      default:
        icon = '<i class="fa-solid fa-circle-info"></i>';
        actionText = 'Action recorded';
    }
    
    historyItem.innerHTML = `
      <div class="action-icon">${icon}</div>
      <div class="action-content">
        <div class="action-text">${actionText}</div>
        <div class="action-time">${formattedDate} ${formattedTime}</div>
      </div>
    `;
    
    // Add to the history container
    passwordHistoryEl.appendChild(historyItem);
  });
}

// Generate QR code for the Wi-Fi password
function generateQRCode(password) {
  // First clear the QR code container
  qrCodeEl.innerHTML = '';
  
  if (!password || password === 'Not yet generated') {
    return;
  }
  
  // Get the SSID name (with fallback to default)
  const ssid = loadSSID();
  
  // Create Wi-Fi connection string
  const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;
  
  // Generate QR code using the library
  try {
    // Create type number dynamically based on content length
    const typeNumber = 4; // Higher type number for more data
    const qr = qrcode(typeNumber, 'L'); // L = Low error correction, allows for more data capacity
    qr.addData(wifiString);
    qr.make();
    
    // Create the QR code image with a larger size for better readability
    const qrImg = qr.createImgTag(5, 10); // 5 = cell size, 10 = margin
    qrCodeEl.innerHTML = qrImg;
    
    console.log('QR code generated with data:', wifiString);
  } catch (error) {
    console.error('Error generating QR code:', error, 'with data:', wifiString);
    qrCodeEl.innerHTML = '<p style="color: red;">QR Code generation failed</p>';
  }
}

// Copy the current password to clipboard
function copyPasswordToClipboard() {
  const password = currentPasswordEl.textContent;
  
  if (password === 'Not yet generated') {
    showToast('No password to copy!');
    return;
  }
  
  // Use the clipboard API to copy the password
  navigator.clipboard.writeText(password)
    .then(() => {
      // Log the copy action
      logAction(ACTION_TYPES.COPY, {
        password: password,
        timestamp: new Date().toISOString()
      });
      
      showToast('Password copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy password:', err);
      showToast('Failed to copy password');
    });
}

// Open settings modal
function openSettingsModal() {
  settingsModal.classList.remove('hidden');
}

// Close settings modal
function closeSettingsModal() {
  settingsModal.classList.add('hidden');
}

// Show a toast message
function showToast(message, duration = 3000) {
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  
  // Hide the toast after the specified duration
  setTimeout(() => {
    toastEl.classList.add('hidden');
  }, duration);
}

// Show a custom confirm dialog instead of browser confirm
function showConfirmDialog(message, onConfirm, onCancel) {
  // Set the message
  confirmMessage.textContent = message;
  
  // Set up the callback functions
  confirmOkBtn.onclick = () => {
    confirmDialog.classList.add('hidden');
    if (onConfirm) onConfirm();
  };
  
  confirmCancelBtn.onclick = () => {
    confirmDialog.classList.add('hidden');
    if (onCancel) onCancel();
  };
  
  // Show the dialog
  confirmDialog.classList.remove('hidden');
}

// Set a manual password
function setManualPassword() {
  const manualPassword = manualPasswordInput.value.trim();
  
  // Validate the password format (Mega###* or Mega####*)
  const passwordRegex = /^Mega\d{3,4}\*$/;
  
  if (!passwordRegex.test(manualPassword)) {
    showToast('Invalid password format. Must be Mega followed by 3-4 digits and an asterisk');
    return;
  }
  
  // Check if we already have a password for today
  const existingPassword = getPasswordForToday();
  
  if (existingPassword) {
    // Confirm replacement with custom dialog
    showConfirmDialog('A password for today already exists. Replace it?', 
      // On confirm
      () => {
        // Remove the existing password for today
        passwords.shift();
        continueSettingManualPassword(manualPassword);
      },
      // On cancel - do nothing
      null
    );
    return;
  }
  
  // Check if this password has been used this month
  const isPasswordUsed = passwords.some(entry => entry.password === manualPassword);
  if (isPasswordUsed) {
    showConfirmDialog('This password has already been used this month. Use it anyway?',
      // On confirm
      () => {
        continueSettingManualPassword(manualPassword);
      },
      // On cancel - do nothing
      null
    );
    return;
  }
  
  // If no conflicts, continue with setting the password
  continueSettingManualPassword(manualPassword);
}

// Helper function to continue setting manual password after confirmations
function continueSettingManualPassword(manualPassword) {
  // Create a password entry with today's date
  const timestamp = new Date().toISOString();
  const passwordEntry = {
    date: timestamp,
    password: manualPassword,
    manual: true // Flag to mark it as manually set
  };
  
  // Add to the passwords array
  passwords.unshift(passwordEntry);
  
  // Save to localStorage
  savePasswords();
  
  // Log the manual password setting
  logAction(ACTION_TYPES.MANUAL, {
    password: manualPassword,
    timestamp: timestamp
  });
  
  // Update UI
  displayCurrentPassword(manualPassword);
  updatePasswordHistory();
  showToast('Manual password set successfully!');
  
  // Clear the input field
  manualPasswordInput.value = '';
  
  // Enable buttons
  enablePasswordActions();
  
  // Close settings modal
  closeSettingsModal();
}

// Save SSID to localStorage and update QR code
function saveSSID() {
  const newSSID = ssidInput.value.trim();
  
  if (!newSSID) {
    showToast('Network name cannot be empty');
    return;
  }
  
  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.SSID, newSSID);
  
  // Update global variable
  ssidName = newSSID;
  
  // Log the SSID change
  logAction(ACTION_TYPES.SSID, {
    ssid: newSSID,
    timestamp: new Date().toISOString()
  });
  
  // Regenerate QR code if a password exists
  if (currentPasswordEl.textContent !== 'Not yet generated') {
    generateQRCode(currentPasswordEl.textContent);
  }
  
  showToast('Network name updated successfully');
}

// Initialize the app when the DOM content is loaded
document.addEventListener('DOMContentLoaded', initApp);
