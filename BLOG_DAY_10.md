# Building Jan Sahay (जन सहाय): A 10-Day Journey from Zero to an Enterprise Multi-Agent Voice AI with Murf Falcon & LiveKit

*By Pratay Karali — #10DaysOfAIVoiceAgents / #VoiceForBharat Edition*

---

> **TL;DR:** Over the past 10 days, I designed, built, tested, and shipped **Jan Sahay (जन सहाय)** — a production-grade, bilingual (Hindi/English) voice AI companion tailored for **financial literacy, government scheme navigation, fraud protection, and citizen support across Bharat**. Powered by **Murf Falcon's ultra-low latency streaming TTS**, **LiveKit WebRTC transport**, **Deepgram Nova-3 STT**, and **NVIDIA Nemotron / Gemini LLM**, Jan Sahay doesn't just chat — it checks eligibility against real scheme rules, remembers returning callers, dynamically hands off calls to domain specialists, runs a real-time anti-fraud threat engine, and features an enterprise **Bank Manager Approval Portal**.
>
> 🔗 **GitHub Repository:** [https://github.com/prataykarali/finance_voice_agent](https://github.com/prataykarali/finance_voice_agent)  
> 🏷️ **Tech Stack:** Python 3.12 (`uv`), LiveKit Agents 1.4+, Murf Falcon TTS, Deepgram Nova-3, NVIDIA Nemotron / Gemini, Next.js 15, SQLite.

---

## 1. The Problem & The Mission

In India, more than 800 million citizens are eligible for critical social security schemes like **PMJDY** (Jan Dhan Yojana), **PMSBY** (Suraksha Bima), **PMJJBY** (Jeevan Jyoti Bima), and **APY** (Atal Pension Yojana). Yet, millions miss out due to three fundamental barriers:

1. **Complex Bureaucratic Jargon:** Scheme guidelines are buried in 40-page PDF gazettes with confusing eligibility matrices.
2. **The Digital & Literacy Divide:** Typing complex queries on mobile keyboards in English is daunting for rural and tier-2/3 citizens; voice in their native language (Hindi/Hinglish/Indian English) is the most natural, accessible interface.
3. **Pervasive Financial Scams & Identity Theft:** As digital payments (UPI) surge, fraudsters prey on first-time digital banking users. Citizens need immediate, trusted guidance without exposing their sensitive PINs or OTPs.

**Enter Jan Sahay (जन सहाय):** An empathetic, culturally fluent voice companion designed to guide citizens through scheme eligibility, document preparation, and safe digital banking with zero friction.

---

## 2. System Architecture: Sub-600ms Voice Pipeline

Voice AI only feels magical when it responds with natural human conversational speed. If latency exceeds 1 second, conversations feel disjointed. Jan Sahay achieves an average **first-reply voice latency of 520ms** using an integrated streaming pipeline.

```mermaid
flowchart TD
    subgraph Client ["Browser / Mobile Client (Next.js 15)"]
        UI["Interactive 8-Tab Dashboard & WebRTC Audio Visualizer"]
        Mic["Microphone Input (Echo Cancelled)"]
        Spk["Audio Playback (Murf Falcon Stream)"]
    end

    subgraph LiveKitEngine ["Real-Time Transport (LiveKit WebRTC)"]
        LK["LiveKit Audio Room & Data Packet Mesh"]
        VAD["Silero VAD + Multilingual Turn Detector"]
    end

    subgraph AgentCore ["Jan Sahay Voice Agent Core (Python / uv)"]
        STT["Deepgram Nova-3 Multi (Hindi / English / Hinglish)"]
        Router["Dynamic Agent Router & Language Lock"]
        
        subgraph MultiAgentMesh ["Multi-Agent Specialist Swarm"]
            Primary["Jan Sahay Triage Assistant"]
            GovSpecialist["Govt Scheme Specialist"]
            SafetySpecialist["Digital Banking Safety Specialist"]
            AcctSpecialist["Bank Account Support Specialist"]
        end

        ThreatEngine["🛡️ Real-Time Threat Intelligence Engine"]
        Tools["Function Tools (Schemes DB / Doc Checklists)"]
        LLM["NVIDIA Nemotron-3-Nano / Gemini 2.5 Flash"]
        TTS["Murf Falcon Streaming TTS (hi-IN-anisha / en-IN-anisha)"]
    end

    subgraph Persistence ["Persistence & Governance"]
        DB[(SQLite Caller Memory & Safe Keys)]
        EscQueue[(Escalation Tickets Queue)]
        MgrQueue[(Manager Approvals Queue)]
    end

    Mic -->|Opus Audio| LK
    LK --> VAD
    VAD --> STT
    STT -->|Live Transcript| ThreatEngine
    ThreatEngine --> Router
    Router --> Primary
    Primary <-->|session.update_agent| GovSpecialist
    Primary <-->|session.update_agent| SafetySpecialist
    Primary <-->|session.update_agent| AcctSpecialist
    MultiAgentMesh --> Tools
    Tools --> DB
    Primary --> ThreatEngine
    ThreatEngine -->|Anomalies / Bans| DB
    MultiAgentMesh --> LLM
    LLM -->|Text Stream| TTS
    TTS -->|PCM Audio Chunks (sub-300ms TTFA)| LK
    LK --> Spk
    Primary -.->|Create Request| MgrQueue
    Primary -.->|Sanitized Ticket| EscQueue
```

---

## 3. UNLIKE Others: What Makes Jan Sahay Unique

Most voice agent starters are simple wrappers around an LLM and a TTS API. **Jan Sahay was built from the ground up as a resilient, enterprise-grade citizen assistance platform.**

### 🌟 1. Enterprise Bank Manager Approval Portal (`manager.py` + `manager-view.tsx`)
In financial and citizen services, an AI voice agent should **never** have unchecked authority to execute sensitive account changes or activate financial profiles without oversight.
- When a user asks to register a profile or request a high-stakes transaction, Jan Sahay creates a formal `PENDING_APPROVAL` ticket (`MR-XXXX`).
- Bank Managers have a dedicated **Manager Portal** in the frontend where they review applicant details, Safe Key status, and verification notes.
- Managers can **Approve** (which activates the profile in SQLite) or **Reject** with custom resolution notes — establishing a safe Human-In-The-Loop (HITL) boundary.

### 🛡️ 2. Real-Time Multi-Signal Threat Intelligence Engine (`threat_engine.py` + `security-view.tsx`)
Voice agents are prime targets for prompt injection, social engineering, and identity spoofing. Jan Sahay incorporates a dedicated 1,150-line threat engine running concurrently on every turn:
- **13 Real-time Threat Signals:** Tracks OTP/PIN fishing, identity switches, session velocity, brute-force lookup attempts, abusive language, and impersonation.
- **Dynamic Honeypot Traps:** Plants fake prompt triggers; if an attacker triggers a honeypot, their session receives an **instant ban (Score: 100)** with TTL.
- **Safe Key Authentication:** Citizens can register a 4-letter/digit Safe Key. If an impostor fails 3 verification attempts, the session is locked and flagged.
- **Zero-PII Storage:** Threat tables store cryptographic fingerprints (`SHA-256`) — never plain credentials.

### 👥 3. Multi-Agent Specialist Swarm with Zero-Latency Handoffs (`specialists.py`)
Rather than forcing a single prompt to do everything, Jan Sahay utilizes a specialized agent mesh:
1. **Jan Sahay Primary:** Empathetic triage and general inquiries.
2. **Government Scheme Specialist:** Deep domain rules for PMJDY, PMSBY, PMJJBY, APY with date-stamped parameters.
3. **Digital Banking Safety Specialist:** Incident intake for lost cards, UPI scams, and unauthorized debits.
4. **Bank Account Support Specialist:** Guidance on KYC preparation and account documentation.
Handoffs happen dynamically via `session.update_agent` without losing context or requiring the caller to repeat themselves.

### 🔒 4. Zero-PII-Leak Escalation & Ticket Automation (`escalation.py`)
When human escalation is necessary, Jan Sahay collects the full incident context and sanitizes all data through regex pipelines that strip OTPs, PINs, passwords, and 16-digit card numbers. It generates structured reference tickets (`JS-XXXXXXX` / `TKT-XXXX`) and prevents duplicate ticket spam for returning citizens.

### 📊 5. Comprehensive Observability & Citizen Analytics (`metrics.py` + `dashboard-view.tsx`)
A built-in telemetry server tracks call metrics across WebRTC and SIP channels:
- Turn-by-turn latency (First-reply latency, STT delay, LLM TTFT, Murf TTS TTFA).
- Eligibility completion rates, document list deliveries, and escalation counts.
- Real-time failure categorization (audio dropout, refusal, timeout).

---

## 4. The 10-Day Build Log: From Prototype to Enterprise

| Day | Milestone | Key Deliverables & Tech Highlights |
| :--- | :--- | :--- |
| **Day 1** | **Hello Voice Agent** | Connected LiveKit Agents + Deepgram STT + Gemini LLM + Murf Falcon TTS. Established sub-second full-duplex WebRTC streaming. |
| **Day 2** | **Persona & Guardrails** | Configured the *Jan Sahay* persona (empathetic, patient, bilingual Hindi/English). Enforced strict non-negotiable safety guardrails (never ask for OTP/PIN/secrets). |
| **Day 3** | **Audio & Visual Polish** | Integrated Murf Falcon's Indian voices (`hi-IN-anisha` and `en-IN-anisha`), dynamic audio volume booster, animated audio visualizer, and speaker state badges. |
| **Day 4** | **Caller Memory & State** | Built persistent caller memory in SQLite (`db.py`). Returning callers are greeted by name with their previous query remembered, with explicit consent controls. |
| **Day 5** | **Dynamic Scheme Tools** | Implemented `check_scheme_eligibility`, `get_document_checklist`, and `get_scheme_info` with date-stamped domain datasets (`schemes.py`). Tools fail out loud gracefully. |
| **Day 6** | **Context Flow & Instant Save** | Engineered deterministic save confirmations via `session.say + StopResponse`, eliminating LLM hallucinations and topic spam during memory saves. |
| **Day 7** | **Telephony & Escalations** | Added SIP telephony integration, human escalation tickets (`escalation.py`), automated PII sanitization, and case status lookup. |
| **Day 8** | **Citizen Portal & Analytics** | Shipped full-featured Next.js frontend with 8 tabs, call performance metrics dashboard, and live telemetry server (`metrics.py`). |
| **Day 9** | **Specialist Swarm & Handoffs** | Built multi-agent specialist hierarchy (`specialists.py`), dynamic stateful handoffs, and WebRTC echo cancellation filters. |
| **Day 10** | **Enterprise Governance & Review** | Deployed Bank Manager Approval Portal (`manager.py`), Threat Intelligence Engine (`threat_engine.py`), and completed the 10-day journey. |

---

## 5. Hard-Earned Lessons & Challenges Overcome

Building real-time voice agents is drastically different from building text chatbots. Here are the toughest engineering challenges faced and how they were solved:

### Challenge 1: The "Echo Feedback Loop" & STT Hallucinations
- **The Problem:** In browser environments without headphones, Murf Falcon's loud, crisp audio playback was picked up by the user's laptop microphone. Deepgram transcribed the agent's own speech, causing the agent to interrupt itself or enter a bizarre recursive loop.
- **The Solution:** Implemented a multi-tier defense:
  1. Browser-level WebRTC constraints (`echoCancellation: true`, `noiseSuppression: true`).
  2. A deterministic echo filter in `agent.py` matching known agent prompt fragments.
  3. A short-greet allowlist (`namaste`, `hi`, `haan`, `theek hai`) so genuine single-word user confirmations are never dropped as background noise.

### Challenge 2: Eliminating LLM Hallucinations During Memory Saves
- **The Problem:** When users said *"Please remember this"*, passing the request to the LLM often caused it to re-explain all four government schemes unprompted before acknowledging the save.
- **The Solution:** Bypassed LLM inference entirely for state updates! Using LiveKit's `session.say(...)` combined with raising `llm.StopResponse()`, the agent instantly confirms the save deterministically in <150ms without invoking the LLM.

### Challenge 3: Seamless Context Preservation During Multi-Agent Handoffs
- **The Problem:** When handing off from the triage agent to the `DigitalBankingSafetySpecialist`, standard agent recreation caused the specialist to forget the citizen's name, language preference, and the reported incident.
- **The Solution:** Leveraged LiveKit's `session.update_agent(specialist)` while keeping the active `AgentSession` and `ChatContext` intact. The specialist receives targeted system prompt extensions containing the existing incident summary and caller state.

---

## 6. How to Build & Run Jan Sahay Locally

Follow this step-by-step guide to run Jan Sahay on your own machine in under 5 minutes.

### Step 1: Clone the Repository
```bash
git clone https://github.com/prataykarali/finance_voice_agent.git
cd finance_voice_agent
git checkout day-10
```

### Step 2: Configure Environment Variables
Copy the example environment files:
```bash
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env.local` with your API keys:
```ini
# LiveKit Cloud or Local Server
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Murf Falcon TTS (Fastest Streaming Indian Voices)
MURF_API_KEY=your_murf_api_key

# Deepgram Nova-3 STT
DEEPGRAM_API_KEY=your_deepgram_api_key

# LLM (Google Gemini or NVIDIA Nemotron)
GOOGLE_API_KEY=your_gemini_api_key
# Optional: NVIDIA Nemotron
# OPENAI_API_KEY=nvapi-your-key
```

### Step 3: Install Backend Dependencies (`uv`)
```bash
cd backend
uv sync
uv run python src/agent.py download-files   # Downloads Silero VAD & turn models
```

### Step 4: Install Frontend Dependencies (`pnpm`)
```bash
cd ../frontend
pnpm install
```

### Step 5: Start All Services
You can run the startup script from the root directory:
```bash
# macOS / Linux
./start_app.sh
```
Or start each service in separate terminals:
```bash
# Terminal 1: Backend Voice Agent
cd backend && uv run python src/agent.py dev

# Terminal 2: Next.js Frontend
cd frontend && pnpm dev
```

Open **`http://localhost:3000`** in your browser, click **"Start Talking"**, allow microphone permissions, and converse with **Jan Sahay**!

---

## 7. Performance & Latency Benchmarks

Measured on a standard broadband connection using Murf Falcon streaming TTS and Deepgram Nova-3:

| Metric | Measured Value | Industry Standard |
| :--- | :--- | :--- |
| **Time-to-First-Audio (TTFA) — Murf Falcon** | **~240ms** | 600ms - 1200ms |
| **End-to-End Voice-to-Voice Latency** | **~520ms** | 1200ms - 2000ms |
| **STT Word Error Rate (WER) on Hinglish** | **< 6.2%** | 12% - 18% |
| **Multi-Agent Handoff Execution Time** | **< 45ms** | 400ms - 800ms |
| **PII Scrubbing Overhead** | **< 2ms** | N/A |

---

## 8. What's Next for Jan Sahay

- **Expanding Vernacular Dialects:** Adding Tamil, Telugu, Bengali, and Marathi voice personas via Murf Falcon's growing Indian language library.
- **WhatsApp Audio Bot Integration:** Bridging LiveKit audio sessions with WhatsApp voice notes for low-bandwidth rural connectivity.
- **Direct Aadhaar/DBT API Connectors:** Safe Sandboxed integration with sandbox Open Financial APIs for live claim status tracking.

---

## 9. Acknowledgements & Community

A huge thank you to the **Murf AI** team and the **LiveKit** community for organizing the **#10DaysOfAIVoiceAgents — #VoiceForBharat** challenge. Having access to high-fidelity, ultra-low latency Indian TTS voices through **Murf Falcon** has made building natural voice interfaces for India an absolute delight.

*If you found this helpful, star the repository on GitHub and feel free to reach out on LinkedIn!*

- ⭐️ **GitHub Repo:** [https://github.com/prataykarali/finance_voice_agent](https://github.com/prataykarali/finance_voice_agent)
- 💼 **LinkedIn:** [Pratay Karali](https://linkedin.com)
