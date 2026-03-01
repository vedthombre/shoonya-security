# CodeShield Browser Extension

🛡️ **Protect your credentials when sharing code with AI tools**

## Features

- **Real-time Scanning**: Detects secrets as you type or paste
- **Auto-redaction**: Replaces secrets with safe placeholders
- **Multi-platform Support**: Works on ChatGPT, Claude, GitHub Copilot, and more
- **10+ Secret Types**: AWS keys, API keys, passwords, tokens, etc.
- **Privacy-focused**: All processing happens locally in your browser

## Installation

### Method 1: Developer Mode (Recommended for Testing)

1. **Enable Developer Mode** in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" (top right)

2. **Load Extension**:
   - Click "Load unpacked"
   - Select the `extension` folder from this repository
   - CodeShield will appear in your extensions list

3. **Verify Installation**:
   - Look for the CodeShield icon (🛡️) in your toolbar
   - Click the icon to see the popup

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store for easy installation.

## Usage

### Automatic Protection

1. **Visit Supported Sites**:
   - ChatGPT (chat.openai.com, chatgpt.com)
   - Claude (claude.ai)
   - GitHub Copilot (github.com/copilot)
   - Microsoft Copilot (copilot.microsoft.com)
   - Google Bard/Gemini (bard.google.com, gemini.google.com)

2. **CodeShield Activates Automatically**:
   - Scans text as you type
   - Shows warnings for detected secrets
   - Auto-redacts if enabled

### Manual Controls

**Extension Popup**:
- Click the CodeShield icon in your toolbar
- View scan statistics and recent detections
- Toggle scanning on/off
- Restore redacted content

**Settings**:
- Right-click the extension icon → Options
- Configure protection levels
- Customize detection sensitivity
- Manage privacy settings

## Supported Secret Types

| Type | Example | Description |
|------|---------|-------------|
| AWS Access Key | `AKIAIOSFODNN7EXAMPLE` | AWS access key identifiers |
| AWS Secret Key | `wJalrXUtnFEMI/K7MDENG/...` | AWS secret access keys |
| OpenAI API Key | `sk-1234567890abcdef...` | OpenAI API keys |
| Stripe Keys | `sk_live_`, `sk_test_` | Stripe live/test keys |
| Google API Key | `AIzaSyDaGmWKa4JsXZ...` | Google API keys |
| JWT Tokens | `eyJhbGciOiJIUzI1NiIs...` | JSON Web Tokens |
| Bearer Tokens | `Bearer abc123...` | Authorization headers |
| Private Keys | `-----BEGIN PRIVATE KEY-----` | RSA/EC private keys |
| Passwords | `password=`, `pwd:` | Password assignments |
| High Entropy | Random strings >20 chars | Unknown secret patterns |

## Configuration Options

### Protection Levels

- **High**: Full protection (scan + warnings + auto-redaction)
- **Medium**: Partial protection (scan + warnings)
- **Low**: Scan only (no automatic actions)

### Settings

- **Auto-redact**: Automatically replace detected secrets
- **Show warnings**: Display alert banners
- **Scan on paste**: Analyze pasted content
- **Notifications**: Browser notifications for alerts
- **Custom patterns**: Add your own detection rules

## Testing

### Test the Extension

1. **Open a Supported Site** (e.g., ChatGPT)
2. **Paste Test Code**:
   ```javascript
   const apiKey = "sk-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
   const password = "mySecretPassword123!";
   ```
3. **Observe Results**:
   - Warning banner appears
   - Content is auto-redacted
   - Extension popup shows detection count

### Verify Functionality

- ✅ Warning banner appears
- ✅ Secrets are replaced with placeholders
- ✅ Extension badge shows count
- ✅ Popup displays recent detections
- ✅ Settings page works correctly

## Troubleshooting

### Extension Not Working

1. **Check Permissions**:
   - Ensure Developer Mode is enabled
   - Verify site permissions are granted

2. **Reload Extension**:
   - Go to `chrome://extensions/`
   - Click "Reload" for CodeShield

3. **Check Console**:
   - Open Developer Tools (F12)
   - Look for error messages in Console tab

### False Positives

1. **Adjust Sensitivity**:
   - Go to Options → Protection
   - Lower the sensitivity slider

2. **Add Exclusions**:
   - Add specific patterns to exclude
   - Add sites to exclude list

### Missing Detections

1. **Increase Sensitivity**:
   - Go to Options → Protection
   - Raise the sensitivity slider

2. **Add Custom Patterns**:
   - Go to Options → Advanced
   - Add your own regex patterns

## Privacy & Security

- **Local Processing**: All scanning happens in your browser
- **No Data Collection**: No content is sent to external servers
- **Optional Analytics**: Anonymous usage stats can be disabled
- **Open Source**: Code is publicly auditable

## Development

### Building from Source

1. Clone this repository
2. Open `extension/` folder in Chrome Developer Mode
3. Make changes to source files
4. Click "Reload" in `chrome://extensions/`

### File Structure

```
extension/
├── manifest.json          # Extension configuration
├── content.js            # Page scanning script
├── content.css           # Page styles
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── popup.css             # Popup styles
├── background.js         # Service worker
├── options.html          # Settings page
├── options.js            # Settings logic
├── options.css           # Settings styles
├── engine/              # Detection engine
│   └── index.js         # Browser-adapted engine
└── icons/               # Extension icons
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/ishwari05/codeshield-security/issues)
- **Documentation**: [README](https://github.com/ishwari05/codeshield-security#readme)
- **Discussions**: [GitHub Discussions](https://github.com/ishwari05/codeshield-security/discussions)

---

**Made with ❤️ for secure AI development**
