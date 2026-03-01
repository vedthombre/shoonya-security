/**
 * CodeShield Background Script
 * Manages extension lifecycle and cross-tab communication
 */

// 1. CRITICAL: Import the engine at the top level
import { processCode } from './engine/index.js';

class CodeShieldBackground {
  constructor() {
    this.isInitialized = false;
    this.stats = {
      totalScans: 0,
      secretsBlocked: 0,
      lastActivity: Date.now()
    };

    this.init();
  }

  init() {
    console.log('🛡️ CodeShield Background Script Started');
    this.loadData();
    this.setupEventListeners();
    this.setupPeriodicTasks();
    this.isInitialized = true;
  }

  async loadData() {
    try {
      const result = await chrome.storage.local.get({
        totalScans: 0,
        secretsBlocked: 0,
        lastActivity: Date.now(),
        installDate: Date.now()
      });
      this.stats = result;
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  async saveData() {
    try {
      await chrome.storage.local.set(this.stats);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  setupEventListeners() {
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    chrome.runtime.onStartup.addListener(() => {
      console.log('CodeShield extension started');
      this.updateLastActivity();
    });

    // 2. FIXED: Unified Message Listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("📩 Message received in background:", message);

      // Handle Engine Scans (Action-based from Content Script)
      if (message.action === "scanText") {
        try {
          // Now 'processCode' is defined because of the import at line 7
          const result = processCode(message.text);

          // Log stats locally for the background class
          this.handleScanComplete({ secretsFound: result.secretsFound }, sender);

          sendResponse({ success: true, data: result });
        } catch (error) {
          console.error("❌ Engine execution failed:", error);
          sendResponse({ success: false, error: error.message });
        }
      }
      // Handle Popup UI Requests (Type-based)
      else if (message.type) {
        this.handleMessage(message, sender, sendResponse);
      }
      else {
        console.warn("❓ Received unknown message format:", message);
        sendResponse({ success: false, error: "Unknown message format" });
      }

      return true; // Keep channel open
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivation(activeInfo);
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChange(changes, namespace);
    });
  }

  setupPeriodicTasks() {
    setInterval(() => { this.cleanupOldData(); }, 60 * 60 * 1000);
    setInterval(() => { this.updateBadge(); }, 30 * 1000);
  }

  handleInstallation(details) {
    if (details.reason === 'install') {
      this.showWelcomeNotification();
      this.setDefaults();
    } else if (details.reason === 'update') {
      this.showUpdateNotification();
    }
  }

  async setDefaults() {
    const defaultSettings = {
      enabled: true,
      autoRedact: true,
      showWarnings: true,
      scanOnPaste: true,
      notifications: true,
      darkMode: false,
      protectionLevel: 'high'
    };
    try {
      await chrome.storage.sync.set(defaultSettings);
    } catch (error) {
      console.error('Failed to set defaults:', error);
    }
  }

  showWelcomeNotification() {
    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'CodeShield Installed!',
      message: '🛡️ CodeShield is now protecting you. Click to learn more.',
      priority: 2
    });
  }

  showUpdateNotification() {
    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'CodeShield Updated',
      message: 'New features available. Check out what\'s new!',
      priority: 1
    });
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'getStats': this.getStats(sendResponse); break;
      case 'updateStats': this.updateStats(message.data, sendResponse); break;
      case 'getSettings': this.getSettings(sendResponse); break;
      case 'updateSettings': this.updateSettings(message.data, sendResponse); break;
      case 'resetData': this.resetData(sendResponse); break;
      default: sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  async getStats(sendResponse) {
    try {
      const result = await chrome.storage.local.get(['totalScans', 'secretsBlocked']);
      sendResponse({ success: true, data: result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async updateStats(data, sendResponse) {
    this.stats.totalScans += data.scans || 0;
    this.stats.secretsBlocked += data.secrets || 0;
    await this.saveData();
    sendResponse({ success: true });
  }

  async handleScanComplete(data, sender) {
    this.stats.totalScans++;
    if (data.secretsFound && data.secretsFound.length > 0) {
      this.stats.secretsBlocked += data.secretsFound.length;
      if (data.secretsFound.length > 2) {
        this.showRiskNotification(sender.tab, data.secretsFound.length);
      }
    }
    this.saveData();
    this.updateBadge();
  }

  async getSettings(sendResponse) {
    const result = await chrome.storage.sync.get(null);
    sendResponse({ success: true, data: result });
  }

  async updateSettings(data, sendResponse) {
    await chrome.storage.sync.set(data);
    sendResponse({ success: true });
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      this.updateLastActivity();
    }
  }

  handleTabActivation(activeInfo) {
    this.updateLastActivity();
    this.updateBadge();
  }

  handleStorageChange(changes, namespace) {
    if (namespace === 'sync') {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { type: 'settingsChanged', data: changes }).catch(() => { });
        });
      });
    }
  }

  isSupportedSite(url) {
    if (!url) return false;
    const supported = ['chatgpt.com', 'claude.ai', 'gemini.google.com', 'github.com'];
    return supported.some(domain => url.includes(domain));
  }

  async updateBadge() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0 || !this.isSupportedSite(tabs[0].url)) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }
    // Simple visual indicator that shield is active
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
  }

  showRiskNotification(tab, secretCount) {
    if (!tab) return;
    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'CodeShield Alert',
      message: `🚨 ${secretCount} potential secrets detected!`,
      priority: 2
    });
  }

  updateLastActivity() {
    this.stats.lastActivity = Date.now();
    this.saveData();
  }

  cleanupOldData() { console.log('Cleaning up...'); }
}

new CodeShieldBackground();