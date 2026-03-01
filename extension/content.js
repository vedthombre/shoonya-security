/**
 * CodeShield Content Script (The Brawn)
 * Reads the web page and sends text to the background worker for scanning.
 */

console.log('🔥 DEBUG: CodeShield content script is loading!');

class CodeShieldContent {
  constructor() {
    this.isScanning = true;
    this.scanDebounce = 500;
    this.scanTimer = null;
    this.originalContent = new Map();
    this.redactedContent = new Map();
    this.detectedSecrets = [];
    this.lastScanTime = 0;

    this.init();
  }

  init() {
    if (!chrome.runtime || !chrome.runtime.id) {
      console.warn('⚠️ Extension context invalidated - reloading page');
      return;
    }

    console.log('🔍 CodeShield Content Script Initialized (Message Passing Mode)');

    this.loadSettings().then(settings => {
      this.settings = settings;
      if (settings.enabled) {
        this.startScanning();
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true;
    });

    this.observePage();
  }

  async loadSettings() {
    if (!chrome.runtime || !chrome.runtime.id) return { enabled: true, autoRedact: true, showWarnings: true, scanOnPaste: true };
    try {
      return await chrome.storage.sync.get({ enabled: true, autoRedact: true, showWarnings: true, scanOnPaste: true });
    } catch (error) {
      return { enabled: true, autoRedact: true, showWarnings: true, scanOnPaste: true };
    }
  }

  startScanning() {
    this.isScanning = true;
    this.scanCurrentPage();
    document.addEventListener('input', this.handleInput.bind(this));
    document.addEventListener('paste', this.handlePaste.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  stopScanning() {
    this.isScanning = false;
    if (this.scanTimer) clearTimeout(this.scanTimer);
  }

  handleInput(event) {
    if (!this.isScanning || !this.settings.scanOnPaste) return;
    if (this.isCodeElement(event.target)) this.debouncedScan(event.target);
  }

  handlePaste(event) {
    if (!this.isScanning || !this.settings.scanOnPaste) return;
    if (this.isCodeElement(event.target)) setTimeout(() => this.debouncedScan(event.target), 100);
  }

  handleKeyUp(event) {
    if (!this.isScanning) return;
    if (this.isCodeElement(event.target) && event.key === 'Enter') this.debouncedScan(event.target);
  }

  isCodeElement(element) {
    const codeSelectors = ['textarea', 'input', 'pre', 'code', '[role="textbox"]', '[contenteditable="true"]'];
    return codeSelectors.some(selector => element.matches?.(selector) || element.closest?.(selector));
  }

  debouncedScan(element) {
    if (!this.isScanning) return;
    if (this.scanTimer) clearTimeout(this.scanTimer);

    this.scanTimer = setTimeout(() => {
      if (this.isScanning) this.scanElement(element);
    }, this.scanDebounce);
  }

  async scanElement(element) {
    if (element.dataset.codeshieldScanned === 'true') return;

    const text = this.getElementText(element);
    if (!text || text.length < 10) return;

    element.dataset.codeshieldScanned = 'true';

    try {
      const response = await chrome.runtime.sendMessage({
        action: "scanText",
        text: text
      });

      if (response && response.success && response.data) {
        const result = response.data;

        if (result.secretsFound.length > 0) {
          console.log('🚨 CodeShield detected secrets:', result.secretsFound);
          this.handleSecretsFound(element, result);
        }
      }
    } catch (error) {
      console.warn("⚠️ CodeShield could not reach the background engine:", error);
      delete element.dataset.codeshieldScanned;
    }
  }

  getElementText(element) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') return element.value;
    return element.textContent || element.innerText;
  }

  setElementText(element, text) {
    const wasScanning = this.isScanning;
    this.isScanning = false;

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.value = text;
    } else if (element.contentEditable === 'true') {
      element.textContent = text;
    }

    setTimeout(() => { this.isScanning = wasScanning; }, 100);
  }

  handleSecretsFound(element, result) {
    this.detectedSecrets = result.secretsFound;

    const now = Date.now();
    if (now - this.lastScanTime < 2000) return;
    this.lastScanTime = now;

    if (this.settings.showWarnings) this.showWarning(element, result);
    if (this.settings.autoRedact) this.redactElement(element, result);
    this.notifyPopup(result);
  }

  showWarning(element, result) {
    document.querySelectorAll('.codeshield-warning').forEach(w => w.remove());

    const warning = document.createElement('div');
    warning.className = 'codeshield-warning';
    warning.innerHTML = `
      <div class="codeshield-warning-content">
        <span class="codeshield-icon">⚠️</span>
        <span class="codeshield-text">${result.secretsFound.length} secret(s) detected!</span>
        <button class="codeshield-close-btn">×</button>
      </div>
    `;

    if (element.parentNode) element.parentNode.insertBefore(warning, element);
    warning.querySelector('.codeshield-close-btn').addEventListener('click', () => warning.remove());
    setTimeout(() => { if (warning.parentNode) warning.remove(); }, 5000);
  }

  redactElement(element, result) {
    const originalText = this.getElementText(element);
    this.originalContent.set(element, originalText);
    this.setElementText(element, result.redactedCode);
    this.redactedContent.set(element, result.mapping);
    element.classList.add('codeshield-redacted');
  }

  // FIXED: Added missing restoreElement function
  restoreElement(element) {
    const originalText = this.originalContent.get(element);
    if (originalText) {
      this.setElementText(element, originalText);
      element.classList.remove('codeshield-redacted');
      this.originalContent.delete(element);
      this.redactedContent.delete(element);
    }
  }

  notifyPopup(result) {
    if (!chrome.runtime || !chrome.runtime.id) return;
    try {
      chrome.runtime.sendMessage({
        type: 'secretsDetected',
        data: { secretsFound: result.secretsFound.length, url: window.location.href, timestamp: Date.now() }
      });
    } catch (error) { }
  }

  // FIXED: Rewritten with proper radio receivers
  handleMessage(message, sendResponse) {
    console.log('📨 Handling message from popup:', message.type);

    switch (message.type) {
      case 'ping':
        sendResponse({ success: true });
        break;
      case 'getScanResults':
        sendResponse({ secretsFound: this.detectedSecrets, redactedElements: Array.from(this.redactedContent.keys()) });
        break;
      case 'toggleScanning':
        message.enabled ? this.startScanning() : this.stopScanning();
        sendResponse({ success: true });
        break;
      case 'scanCurrentPage':
        this.scanCurrentPage();
        sendResponse({ success: true });
        break;
      case 'restoreAll':
        this.originalContent.forEach((_, element) => this.restoreElement(element));
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ success: false, error: 'Unknown command' });
    }
  }

  // FIXED: Updated query selector to match our input fix
  scanCurrentPage() {
    document.querySelectorAll('textarea, input, [contenteditable="true"]').forEach(element => {
      this.scanElement(element);
    });
  }

  // FIXED: Updated query selector to match our input fix
  observePage() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (this.isCodeElement(node)) this.scanElement(node);
            node.querySelectorAll?.('textarea, input, [contenteditable="true"]').forEach(el => this.scanElement(el));
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CodeShieldContent());
} else {
  new CodeShieldContent();
}