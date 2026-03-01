/**
 * CodeShield Content Script
 * Real-time scanning and redaction in web pages
 */

console.log('🔥 DEBUG: CodeShield content script is loading!');

class CodeShieldContent {
  constructor() {
    this.engine = new CodeShieldEngine();
    this.isScanning = true;
    this.scanDebounce = 500; // Increased debounce time
    this.scanTimer = null;
    this.originalContent = new Map();
    this.redactedContent = new Map();
    this.detectedSecrets = [];
    this.lastScanTime = 0;
    
    this.init();
  }

  init() {
    // Check if extension context is valid
    if (!chrome.runtime || !chrome.runtime.id) {
      console.warn('⚠️ Extension context invalidated - reloading page');
      window.location.reload();
      return;
    }
    
    console.log('🔍 CodeShield Content Script Initialized (using full engine pipeline)');
    console.log('🛠️ Full engine available:', typeof processCode !== 'undefined');
    
    // Load settings
    this.loadSettings().then(settings => {
      this.settings = settings;
      console.log('⚙️ Settings loaded:', settings);
      if (settings.enabled) {
        this.startScanning();
      }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📨 Content script received message:', message.type);
      this.handleMessage(message, sendResponse);
      return true;
    });

    // Monitor DOM changes
    this.observePage();
  }

  async loadSettings() {
    // Check extension context before using chrome APIs
    if (!chrome.runtime || !chrome.runtime.id) {
      return {
        enabled: true,
        autoRedact: true,
        showWarnings: true,
        scanOnPaste: true,
        supportedSites: true
      };
    }
    
    const defaultSettings = {
      enabled: true,
      autoRedact: true,
      showWarnings: true,
      scanOnPaste: true,
      supportedSites: true
    };
    
    try {
      const result = await chrome.storage.sync.get(defaultSettings);
      return result;
    } catch (error) {
      console.warn('⚠️ Storage access failed:', error);
      return defaultSettings;
    }
  }

  startScanning() {
    this.isScanning = true;
    this.scanCurrentPage();
    
    // Monitor input events
    document.addEventListener('input', this.handleInput.bind(this));
    document.addEventListener('paste', this.handlePaste.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  stopScanning() {
    this.isScanning = false;
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
    }
  }

  handleInput(event) {
    if (!this.isScanning || !this.settings.scanOnPaste) return;
    
    const element = event.target;
    if (this.isCodeElement(element)) {
      this.debounceScan(element);
    }
  }

  handlePaste(event) {
    if (!this.isScanning || !this.settings.scanOnPaste) return;
    
    const element = event.target;
    if (this.isCodeElement(element)) {
      setTimeout(() => this.debounceScan(element), 100);
    }
  }

  handleKeyUp(event) {
    if (!this.isScanning) return;
    
    const element = event.target;
    if (this.isCodeElement(element) && event.key === 'Enter') {
      this.debounceScan(element);
    }
  }

  isCodeElement(element) {
    const tagName = element.tagName.toLowerCase();
    const codeSelectors = [
      'textarea',
      'input[type="text"]',
      'pre',
      'code',
      '[contenteditable="true"]',
      '.code',
      '.editor',
      '.input-field',
      '.prompt-input'
    ];
    
    return codeSelectors.some(selector => 
      element.matches(selector) || element.closest(selector)
    );
  }

  debouncedScan(element) {
    if (!this.isScanning) {
      console.log('⏭️ Scanning disabled, skipping');
      return;
    }
    
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
    }
    
    this.scanTimer = setTimeout(() => {
      if (this.isScanning) { // Double-check scanning is still enabled
        this.scanElement(element);
      }
    }, this.scanDebounce);
  }

  scanElement(element) {
    console.log('🔍 Scanning element:', element.tagName, element.className);
    
    // Prevent infinite loops
    if (element.dataset.codeshieldScanned === 'true') {
      console.log('⏭️ Element already scanned, skipping');
      return;
    }
    
    const text = this.getElementText(element);
    console.log('📝 Element text:', text ? text.substring(0, 100) + '...' : 'empty');
    
    if (!text || text.length < 10) {
      console.log('⏭️ Skipping - text too short or empty');
      return;
    }

    const result = this.engine.processCode(text);
    console.log('🔍 Full engine scan result:', result);
    
    // Mark as scanned BEFORE processing to prevent loops
    element.dataset.codeshieldScanned = 'true';
    
    if (result.secretsFound.length > 0) {
      console.log('🚨 Secrets found:', result.secretsFound.length);
      console.log('📊 Processing time:', result.metadata?.processingTime || 'N/A', 'ms');
      this.handleSecretsFound(element, result);
    } else {
      console.log('✅ No secrets found');
    }
  }

  getElementText(element) {
    if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
      return element.value;
    } else if (element.contentEditable === 'true') {
      return element.textContent || element.innerText;
    } else {
      return element.textContent || element.innerText;
    }
  }

  setElementText(element, text) {
    // Temporarily disable scanning to prevent loops
    const wasScanning = this.isScanning;
    this.isScanning = false;
    
    if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
      element.value = text;
    } else if (element.contentEditable === 'true') {
      element.textContent = text;
    }
    
    // Re-enable scanning after a short delay
    setTimeout(() => {
      this.isScanning = wasScanning;
    }, 100);
  }

  handleSecretsFound(element, result) {
    console.log('🚨 CodeShield detected secrets:', result.secretsFound);
    
    this.detectedSecrets = result.secretsFound;
    
    // Prevent duplicate warnings within 2 seconds
    const now = Date.now();
    if (now - this.lastScanTime < 2000) {
      console.log('⏭️ Skipping duplicate warning');
      return;
    }
    this.lastScanTime = now;
    
    // Show warning
    if (this.settings.showWarnings) {
      this.showWarning(element, result);
    }
    
    // Auto-redact if enabled
    if (this.settings.autoRedact) {
      this.redactElement(element, result);
    }
    
    // Notify popup
    this.notifyPopup(result);
  }

  showWarning(element, result) {
    // Remove ALL existing warnings to prevent duplicates
    const existingWarnings = document.querySelectorAll('.codeshield-warning');
    existingWarnings.forEach(warning => warning.remove());

    // Create warning element
    const warning = document.createElement('div');
    warning.className = 'codeshield-warning';
    warning.innerHTML = `
      <div class="codeshield-warning-content">
        <span class="codeshield-icon">⚠️</span>
        <span class="codeshield-text">
          ${result.secretsFound.length} potential secret(s) detected!
        </span>
        <button class="codeshield-view-btn">View</button>
        <button class="codeshield-close-btn">×</button>
      </div>
    `;

    // Insert warning before the element
    if (element.parentNode) {
      element.parentNode.insertBefore(warning, element);
    } else {
      // Fallback: add to body
      document.body.appendChild(warning);
    }

    // Add event listeners
    warning.querySelector('.codeshield-view-btn').addEventListener('click', () => {
      this.showSecretDetails(result);
    });

    warning.querySelector('.codeshield-close-btn').addEventListener('click', () => {
      warning.remove();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (warning.parentNode) {
        warning.remove();
      }
    }, 10000);
  }

  redactElement(element, result) {
    const originalText = this.getElementText(element);
    this.originalContent.set(element, originalText);
    
    this.setElementText(element, result.redactedCode);
    this.redactedContent.set(element, result.mapping);
    
    // Add redaction indicator
    element.classList.add('codeshield-redacted');
  }

  restoreElement(element) {
    const originalText = this.originalContent.get(element);
    if (originalText) {
      this.setElementText(element, originalText);
      element.classList.remove('codeshield-redacted');
      this.originalContent.delete(element);
      this.redactedContent.delete(element);
    }
  }

  showSecretDetails(result) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'codeshield-modal';
    modal.innerHTML = `
      <div class="codeshield-modal-content">
        <div class="codeshield-modal-header">
          <h3>🔍 CodeShield Alert</h3>
          <button class="codeshield-modal-close">×</button>
        </div>
        <div class="codeshield-modal-body">
          <p><strong>${result.secretsFound.length}</strong> potential secrets detected:</p>
          <div class="codeshield-secrets-list">
            ${result.secretsFound.map((secret, i) => `
              <div class="codeshield-secret-item">
                <span class="codeshield-secret-type">${secret.type}</span>
                <span class="codeshield-secret-value">${this.truncateSecret(secret.value)}</span>
              </div>
            `).join('')}
          </div>
          <div class="codeshield-actions">
            <button class="codeshield-redact-btn">🛡️ Redact</button>
            <button class="codeshield-restore-btn">↩️ Restore</button>
            <button class="codeshield-ignore-btn">Ignore</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.codeshield-modal-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('.codeshield-redact-btn').addEventListener('click', () => {
      const activeElement = document.activeElement;
      if (activeElement && this.isCodeElement(activeElement)) {
        this.redactElement(activeElement, result);
      }
      modal.remove();
    });

    modal.querySelector('.codeshield-restore-btn').addEventListener('click', () => {
      const activeElement = document.activeElement;
      if (activeElement && this.isCodeElement(activeElement)) {
        this.restoreElement(activeElement);
      }
      modal.remove();
    });

    modal.querySelector('.codeshield-ignore-btn').addEventListener('click', () => {
      modal.remove();
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  truncateSecret(value) {
    if (value.length <= 20) return value;
    return value.substring(0, 10) + '...' + value.substring(value.length - 5);
  }

  notifyPopup(result) {
    // Check extension context before sending messages
    if (!chrome.runtime || !chrome.runtime.id) {
      console.warn('⚠️ Extension context invalidated - cannot send message');
      return;
    }
    
    try {
      chrome.runtime.sendMessage({
        type: 'secretsDetected',
        data: {
          secretsFound: result.secretsFound.length,
          url: window.location.href,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.warn('⚠️ Failed to send message:', error);
    }
  }

  handleMessage(message, sendResponse) {
    console.log('📨 Handling message:', message.type);
    
    switch (message.type) {
      case 'ping':
        console.log('🏓 Received ping - content script is alive');
        sendResponse({ success: true, message: 'pong' });
        break;
        
      case 'getScanResults':
        sendResponse({
          secretsFound: this.detectedSecrets,
          redactedElements: Array.from(this.redactedContent.keys())
        });
        break;
        
      case 'toggleScanning':
        if (message.enabled) {
          this.startScanning();
        } else {
          this.stopScanning();
        }
        sendResponse({ success: true });
        break;
        
      case 'restoreAll':
        this.originalContent.forEach((_, element) => {
          this.restoreElement(element);
        });
        sendResponse({ success: true });
        break;
        
      case 'scanCurrentPage':
        this.scanCurrentPage();
        sendResponse({ success: true });
        break;
        
      default:
        console.log('❓ Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  scanCurrentPage() {
    console.log('🔍 Scanning current page...');
    const codeElements = document.querySelectorAll('textarea, pre, code, [contenteditable="true"]');
    console.log('📊 Found elements to scan:', codeElements.length);
    
    codeElements.forEach((element, index) => {
      console.log(`🔍 Scanning element ${index + 1}/${codeElements.length}:`, element.tagName);
      this.scanElement(element);
    });
    
    console.log('✅ Page scan completed');
  }

  observePage() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Get NodeList and convert to Array
            const nodeList = node.querySelectorAll ? 
              node.querySelectorAll('textarea, pre, code, [contenteditable="true"]') : [];
            
            // Ensure we have an Array
            let codeElements = Array.from ? Array.from(nodeList) : [];
            
            // Add the node itself if it's a code element
            if (this.isCodeElement(node)) {
              codeElements.push(node);
            }
            
            // Scan all found elements
            codeElements.forEach(element => {
              setTimeout(() => this.scanElement(element), 100);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CodeShieldContent();
  });
} else {
  new CodeShieldContent();
}
