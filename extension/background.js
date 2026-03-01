/**
 * CodeShield Background Script
 * Manages extension lifecycle and cross-tab communication
 */

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
    
    // Load existing data
    this.loadData();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup periodic tasks
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
    // Extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Extension startup
    chrome.runtime.onStartup.addListener(() => {
      console.log('CodeShield extension started');
      this.updateLastActivity();
    });

    // Message handling
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    // Tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Tab activation
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivation(activeInfo);
    });

    // Storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChange(changes, namespace);
    });
  }

  setupPeriodicTasks() {
    // Cleanup old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);

    // Update badge every 30 seconds
    setInterval(() => {
      this.updateBadge();
    }, 30 * 1000);
  }

  handleInstallation(details) {
    if (details.reason === 'install') {
      console.log('CodeShield installed for the first time');
      this.showWelcomeNotification();
      this.setDefaults();
    } else if (details.reason === 'update') {
      console.log('CodeShield updated to version:', chrome.runtime.getManifest().version);
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
      console.log('Default settings applied');
    } catch (error) {
      console.error('Failed to set defaults:', error);
    }
  }

  showWelcomeNotification() {
    try {
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'CodeShield Installed!',
          message: '🛡️ CodeShield is now protecting you from credential leaks. Click to learn more.',
          priority: 2
        });
      }
    } catch (error) {
      console.log('Could not show welcome notification:', error);
    }
  }

  showUpdateNotification() {
    try {
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'CodeShield Updated',
          message: 'New features and improvements are available. Check out what\'s new!',
          priority: 1
        });
      }
    } catch (error) {
      console.log('Could not show update notification:', error);
    }
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'getStats':
        this.getStats(sendResponse);
        break;
        
      case 'updateStats':
        this.updateStats(message.data, sendResponse);
        break;
        
      case 'scanComplete':
        this.handleScanComplete(message.data, sender, sendResponse);
        break;
        
      case 'getSettings':
        this.getSettings(sendResponse);
        break;
        
      case 'updateSettings':
        this.updateSettings(message.data, sendResponse);
        break;
        
      case 'exportData':
        this.exportData(sendResponse);
        break;
        
      case 'importData':
        this.importData(message.data, sendResponse);
        break;
        
      case 'resetData':
        this.resetData(sendResponse);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  async getStats(sendResponse) {
    try {
      const result = await chrome.storage.local.get({
        totalScans: 0,
        secretsBlocked: 0,
        lastActivity: Date.now(),
        installDate: Date.now()
      });
      
      sendResponse({ success: true, data: result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async updateStats(data, sendResponse) {
    try {
      this.stats.totalScans += data.scans || 0;
      this.stats.secretsBlocked += data.secrets || 0;
      this.stats.lastActivity = Date.now();
      
      await this.saveData();
      await this.updateBadge();
      
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleScanComplete(data, sender, sendResponse) {
    try {
      this.stats.totalScans++;
      this.stats.lastActivity = Date.now();
      
      if (data.secretsFound && data.secretsFound.length > 0) {
        this.stats.secretsBlocked += data.secretsFound.length;
        
        // Show notification for high-risk detections
        if (data.secretsFound.length > 2) {
          this.showRiskNotification(sender.tab, data.secretsFound.length);
        }
      }
      
      await this.saveData();
      await this.updateBadge();
      
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async getSettings(sendResponse) {
    try {
      const result = await chrome.storage.sync.get({
        enabled: true,
        autoRedact: true,
        showWarnings: true,
        scanOnPaste: true,
        notifications: true,
        darkMode: false,
        protectionLevel: 'high'
      });
      
      sendResponse({ success: true, data: result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async updateSettings(data, sendResponse) {
    try {
      await chrome.storage.sync.set(data);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async exportData(sendResponse) {
    try {
      const data = await chrome.storage.local.get(null);
      const settings = await chrome.storage.sync.get(null);
      
      const exportData = {
        stats: data,
        settings: settings,
        exportDate: new Date().toISOString(),
        version: chrome.runtime.getManifest().version
      };
      
      sendResponse({ success: true, data: exportData });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async importData(data, sendResponse) {
    try {
      if (data.stats) {
        await chrome.storage.local.set(data.stats);
      }
      
      if (data.settings) {
        await chrome.storage.sync.set(data.settings);
      }
      
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async resetData(sendResponse) {
    try {
      await chrome.storage.local.clear();
      await chrome.storage.sync.clear();
      
      // Reset to defaults
      await this.setDefaults();
      
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    // Only handle complete page loads
    if (changeInfo.status === 'complete' && tab.url) {
      this.updateLastActivity();
      
      // Check if this is a supported AI tool
      if (this.isSupportedSite(tab.url)) {
        console.log('CodeShield activated on:', tab.url);
      }
    }
  }

  handleTabActivation(activeInfo) {
    this.updateLastActivity();
    this.updateBadge();
  }

  handleStorageChange(changes, namespace) {
    if (namespace === 'sync') {
      // Settings changed - notify all content scripts
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (this.isSupportedSite(tab.url)) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'settingsChanged',
              data: changes
            }).catch(() => {
              // Content script not loaded, ignore
            });
          }
        });
      });
    }
  }

  isSupportedSite(url) {
    if (!url) return false;
    
    const supportedDomains = [
      'chat.openai.com',
      'chatgpt.com',
      'copilot.microsoft.com',
      'github.com/copilot',
      'claude.ai',
      'bard.google.com',
      'gemini.google.com'
    ];
    
    try {
      const urlObj = new URL(url);
      return supportedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch (error) {
      return false;
    }
  }

  async updateBadge() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) return;
      
      const currentTab = tabs[0];
      
      if (!this.isSupportedSite(currentTab.url)) {
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setBadgeBackgroundColor({ color: '#999999' });
        return;
      }
      
      // Get recent scan results
      try {
        const response = await chrome.tabs.sendMessage(currentTab.id, {
          type: 'getScanResults'
        });
        
        if (response && response.secretsFound) {
          const count = response.secretsFound.length;
          
          if (count > 0) {
            chrome.action.setBadgeText({ text: count.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
          } else {
            chrome.action.setBadgeText({ text: '✓' });
            chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
          }
        } else {
          chrome.action.setBadgeText({ text: '?' });
          chrome.action.setBadgeBackgroundColor({ color: '#ffc107' });
        }
      } catch (error) {
        chrome.action.setBadgeText({ text: '?' });
        chrome.action.setBadgeBackgroundColor({ color: '#ffc107' });
      }
    } catch (error) {
      console.error('Failed to update badge:', error);
    }
  }

  showRiskNotification(tab, secretCount) {
    if (!tab) return;
    
    try {
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'CodeShield Alert',
          message: `🚨 ${secretCount} potential secrets detected on ${new URL(tab.url).hostname}`,
          priority: 2,
          buttons: [
            {
              title: 'View Details'
            },
            {
              title: 'Disable Scanning'
            }
          ]
        });
      }
    } catch (error) {
      console.log('Could not show risk notification:', error);
    }
  }

  updateLastActivity() {
    this.stats.lastActivity = Date.now();
    this.saveData();
  }

  cleanupOldData() {
    // Clean up old notification data, logs, etc.
    console.log('Performing cleanup...');
  }
}

// Initialize background script
new CodeShieldBackground();
