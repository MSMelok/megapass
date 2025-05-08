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
  RESET: 'reset',
  SHOW_PASSWORD: 'show_password' // Added new action type
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
// Show password button
const showPasswordBtn = document.getElementById('show-password-btn');

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
let passwordTimer = null; // Timer for showing password

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

  // Show password button
  showPasswordBtn.addEventListener('click', togglePasswordVisibility);
  
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
  currentPasswordEl.classList.add('blurred'); // Ensure password is blurred by default
  generateQRCode(password);
}

// Toggle password visibility
function togglePasswordVisibility() {
  // If already visible, hide it
  if (!currentPasswordEl.classList.contains('blurred')) {
    hidePassword();
    return;
  }
  
  // Show the password
  currentPasswordEl.classList.remove('blurred');
  showPasswordBtn.classList.add('active');
  showPasswordBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i> Hide Password';
  
  // Log the action
  logAction(ACTION_TYPES.SHOW_PASSWORD, {
    timestamp: new Date().toISOString(),
    action: 'show'
  });
  
  // Create timer indicator
  createTimerIndicator();
  
  // Start timer to hide password after 10 seconds
  if (passwordTimer) clearTimeout(passwordTimer);
  
  passwordTimer = setTimeout(() => {
    hidePassword();
  }, 10000);
}

// Hide password
function hidePassword() {
  currentPasswordEl.classList.add('blurred');
  showPasswordBtn.classList.remove('active');
  showPasswordBtn.innerHTML = '<i class="fa-regular fa-eye"></i> Show Password';
  
  // Remove timer indicator if exists
  const timerIndicator = document.querySelector('.timer-indicator');
  if (timerIndicator) {
    timerIndicator.remove();
  }
  
  // Clear the timer
  if (passwordTimer) {
    clearTimeout(passwordTimer);
    passwordTimer = null;
  }

  // Log the action
  logAction(ACTION_TYPES.SHOW_PASSWORD, {
    timestamp: new Date().toISOString(),
    action: 'hide'
  });
}

// Create visual timer indicator
function createTimerIndicator() {
  // Remove existing indicator if present
  const existingIndicator = document.querySelector('.timer-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // Create new indicator
  const indicator = document.createElement('span');
  indicator.classList.add('timer-indicator');
  
  // Add it to the password element
  currentPasswordEl.appendChild(indicator);
  
  // Start animation
  let width = 100;
  const interval = setInterval(() => {
    width -= 1;
    indicator.style.transform = `scaleX(${width / 100})`;
    
    if (width <= 0) {
      clearInterval(interval);
    }
  }, 100);
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

// Copy current password to clipboard
function copyPasswordToClipboard() {
  const passwordText = currentPasswordEl.textContent;
  
  if (passwordText && passwordText !== 'Not yet generated') {
    navigator.clipboard.writeText(passwordText)
      .then(() => {
        showToast('Password copied to clipboard!');
        
        // Log the copy action
        logAction(ACTION_TYPES.COPY, {
          password: passwordText,
          timestamp: new Date().toISOString()
        });
      })
      .catch(err => {
        console.error('Could not copy password: ', err);
        showToast('Failed to copy password', true);
      });
  }
}

// Set a manual password
function setManualPassword() {
  const manualPassword = manualPasswordInput.value.trim();
  const pattern = isUsingFourDigits ? /^Mega\d{4}\*$/ : /^Mega\d{3}\*$/;
  
  if (!pattern.test(manualPassword)) {
    const errorMessage = isUsingFourDigits 
      ? 'Password should be in format Mega####*' 
      : 'Password should be in format Mega###*';
    
    showToast(errorMessage, true);
    return;
  }
  
  // Create a password entry
  const passwordEntry = {
    date: new Date().toISOString(),
    password: manualPassword
  };
  
  // Add to the passwords array
  passwords.unshift(passwordEntry);
  
  // Save to localStorage
  savePasswords();
  
  // Log this action
  logAction(ACTION_TYPES.MANUAL, {
    password: manualPassword,
    timestamp: new Date().toISOString()
  });
  
  // Update UI
  displayCurrentPassword(manualPassword);
  updatePasswordHistory();
  showToast('Manual password set successfully!');
  
  // Clear the input field
  manualPasswordInput.value = '';
  
  // Close settings modal
  closeSettingsModal();
  
  // Enable buttons
  enablePasswordActions();
}

// Save SSID
function saveSSID() {
  const newSSID = ssidInput.value.trim();
  
  if (!newSSID) {
    showToast('Please enter a valid SSID', true);
    return;
  }
  
  // Save SSID to localStorage
  localStorage.setItem(STORAGE_KEYS.SSID, newSSID);
  ssidName = newSSID;
  
  // Log the SSID change
  logAction(ACTION_TYPES.SSID, {
    ssid: newSSID,
    timestamp: new Date().toISOString()
  });
  
  // Regenerate QR code with the new SSID
  const currentPassword = currentPasswordEl.textContent;
  if (currentPassword && currentPassword !== 'Not yet generated') {
    generateQRCode(currentPassword);
  }
  
  showToast(`Network name updated to "${newSSID}"`);
}

// Generate QR Code for Wi-Fi
function generateQRCode(password) {
  if (!password || password === 'Not yet generated') {
    qrCodeEl.innerHTML = '';
    return;
  }

  // Get the current SSID
  ssidName = loadSSID();
  
  // Create Wi-Fi config text
  const wifiConfig = `WIFI:S:${ssidName};T:WPA;P:${password};;`;
  
  // Generate QR code
  try {
    qrCodeEl.innerHTML = '';
    
    const qr = qrcode(0, 'L');
    qr.addData(wifiConfig);
    qr.make();
    
    const qrImg = qr.createImgTag(5);
    qrCodeEl.innerHTML = qrImg;
  } catch (error) {
    console.error('Error generating QR Code:', error);
    qrCodeEl.innerHTML = '<p>QR Code generation failed</p>';
  }
}

// Show a toast notification
function showToast(message, isError = false) {
  // Clear any existing timeout
  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }
  
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  
  if (isError) {
    toastEl.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
  } else {
    toastEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  }
  
  window.toastTimeout = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 3000);
}

// Open settings modal
function openSettingsModal() {
  settingsModal.classList.remove('hidden');
}

// Close settings modal
function closeSettingsModal() {
  settingsModal.classList.add('hidden');
}

// Update history display
function updateHistoryDisplay() {
  // For future implementation if we want to display action history
  // This is a placeholder for now
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);
