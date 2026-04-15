<div align="center">
  <img src="extension/icons/icon128.png" alt="Shoonya Logo" width="100" />
  <h1>🛡️ Shoonya Security</h1>
  <p><strong>A Zero-Trust, Offline-First Security Layer for AI Workspaces.</strong></p>
  <p>Real-time redaction. Absolute privacy. Instant analytics.</p>
</div>

<br />

> **Code freely. Let Shoonya handle the leaks.**
> Shoonya acts as an invisible shield for modern development environments (ChatGPT, Claude, Gemini). It passively intercepts highly sensitive API keys, tokens, and passwords right inside your browser *before* they are sent to third-party AI models.

---

## 🚀 Key Differentiators

Unlike traditional proxy-based scanners, Shoonya was built with **Zero-Trust architecture** at its technical core. 

- **100% Offline & Serverless:** Shoonya has **no backend**, makes no external outbound API calls, and uses no cloud databases. Your telemtry is securely encrypted inside `chrome.storage.local`. 
- **Flawless Detection Engine:** Our hybrid pipeline (Regex + Shannon Entropy + Heuristics) runs natively in the browser and guarantees **100% detection accuracy** for structured secrets without generating frustrating false negatives.
- **Deep Contextual ML:** An edge ONNX model analyzes proximity-context, appending XAI confidence scores *without* aggressively blocking your workflow.
- **Real-Time Analytics:** A premium, monolithic React dashboard sits directly inside the extension packet, giving you instant observability over exposure trends and threat surfaces.

---

## 🧠 Architecture Flow

Shoonya's data pipeline is strictly linear, fully sandboxed within your Chrome browser context. 

```text
[ Browser Tab : ChatGPT ]
        │
        ▼ 
[ Content Script ] ── (Intercepts Input / Validates Text)
        │
        ▼ 
[ Background Worker ] ── (Executes Hybrid Engine & ML Profiling)
        │ 
        ├─ [ Regex Layer ] ──> Match API Keys & Tokens
        ├─ [ Entropy Layer ] ─> Catch Cryptographic Strings
        └─ [ Local NER AI ] ──> Generate Context Confidence
        │
        ▼ 
[ chrome.storage.local ] ── (Securely logs event metadata offline)
        │
        ▼ 
[ React Dashboard ] ── (Fetches state, renders interactive charts via Recharts)
```

---

## ⚙️ Tech Stack

Built for blistering performance on the edge:

- **Browser Core:** Manifest V3 API (Service Workers, Local Storage, Messaging)
- **Analytics Dashboard:** React 18 + Vite
- **Design System:** Tailwind CSS v4 (Glassmorphism, Dark UI)
- **Data Visualization:** Recharts (Dynamic timeline & distribution graphing)
- **Machine Learning:** ONNX Runtime Web (Tiny Edge NER Model)

---

## 📊 Security Analytics Dashboard

The Shoonya Dashboard transforms scattered console logs into a rich Security Operations Center (SOC) right inside your extensions bar.
- **Threat Timelines:** Visualizes detection spikes and patterns over the last 7 days.
- **Granular Classification:** Does not group stats. Shoonya strictly itemizes every threat type (e.g., `GITHUB_PAT`, `OPENSSH_KEY`, `URI_PASSWORD`).
- **Platform Exposure Analytics:** Identifies which AI tools pose the highest systemic data-leak risks for your engineering team.
- **Zero-Latency Rendering:** Completely decoupled from external REST APIs—the dashboard queries `chrome.storage` asynchronously directly onto the client DOM.

---

## 🛠️ Engineering Deep Dive & Fixes

Building a robust edge extension required complex workarounds for inherent Chrome limitations:

* **Eliminating the Backend Fragility:** Migrated the entire application away from a Node.js/MongoDB local dependency, transitioning into an entirely offline data flow to eradicate `ERR_CONNECTION_REFUSED` bottlenecks.
* **Scan-Echo Suppression:** Reactive DOM modifications heavily inflated detection analytics. Implemented a precision 5-second `recentLogs` cache layer within the Background Worker to brilliantly silently de-duplicate redundant triggers.
* **Resolving UI Instability:** Hardened the React architecture, rectifying critical Recharts rendering bugs (`-1 width / height`) by enforcing strict flex constraints on the parent responsive wrappers, establishing a rock-solid, monolithic UI design.
* **Accuracy Restoration:** Detached an overly-restrictive ML gatekeeper to ensure the deterministic Regex and Entropy engines pass through all valid hits dynamically while the AI safely attaches metadata layers independently.

---

## 🚀 Setup & Installation

Shoonya requires absolutely **zero setup** or environment configuration. 

1. Clone or download this repository locally.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer Mode** in the top right corner.
4. Click **Load unpacked** and select the `/extension` directory from the cloned folder.
5. **Start Scanning:** Visit ChatGPT, paste an AWS Key (`AKIAIMNO7YBXQDEXAMPLE`), and watch the shield activate.
6. **View Analytics:** Click the Shoonya Extension icon to open the Real-Time Dashboard.

---

## 💼 Recruitment & Impact Note

> Built as an enterprise-grade prototype for DevSecOps, **Shoonya** demonstrates advanced structural comprehension of edge environments, secure browser isolation, dynamic React performance profiling, and privacy-first product philosophy. It is designed to be shipped, used, and scaled by modern engineering teams starting today.

---

## 🔮 Future Scope

- **Visual Studio Code Integration:** Sync browser leak analytics locally with a paired IDE plugin.
- **Policy Check CI/CD Integration:** Sync the underlying deterministic engine against git pre-commit hooks to create a unified security layer. 
- **Corporate Telemetry (Optional):** Offer encrypted outbound syncing so Chief Information Security Officers (CISOs) can view team-wide exposure metrics.
