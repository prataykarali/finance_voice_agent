# Jan Sahay (जन सहाय) — Enterprise Voice AI Agent for Bharat (Day 10)

**Jan Sahay (जन सहाय)** is a production-grade, bilingual voice AI companion for **financial literacy, government scheme navigation, fraud protection, and citizen support in India**. Powered by **Murf Falcon TTS** and **LiveKit Agents**, it explains national social welfare schemes (PMJDY, PMSBY, PMJJBY, APY), computes eligibility, generates document checklists, handles real-time human escalations, detects fraud with a custom threat intelligence engine, and provides an enterprise **Bank Manager Approval Portal**.

Built for **#10DaysOfAIVoiceAgents** / **#VoiceForBharat** using [Murf Falcon Streaming TTS](https://murf.ai) + [LiveKit Agents](https://docs.livekit.io/agents).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Murf Falcon](https://img.shields.io/badge/TTS-Murf%20Falcon%20(Fastest)-6366F1)](https://murf.ai/api/docs/text-to-speech/streaming)
[![LiveKit](https://img.shields.io/badge/Transport-LiveKit%20WebRTC-002cf2)](https://docs.livekit.io)
[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js%2015-black)](https://nextjs.org)

---

## 📖 Day 10 Journey Blog Post
Read the complete 10-day engineering retrospective with benchmarks, architecture deep dives, and challenges overcome in [**`BLOG_DAY_10.md`**](./BLOG_DAY_10.md).

---

## 🌟 UNLIKE Others: Unique Jan Sahay Features

1. **👔 Bank Manager Approval Portal (`backend/src/manager.py` + `frontend/components/app/manager-view.tsx`)**
   - AI cannot blindly activate citizen profiles or execute high-risk operations.
   - Generates structured pending requests (`MR-XXXX`).
   - Dedicated interactive portal for bank managers to review audit notes and **Approve** / **Reject** requests with resolution logging.

2. **🛡️ Real-Time Multi-Signal Threat Intelligence Engine (`backend/src/threat_engine.py` + `frontend/components/app/security-view.tsx`)**
   - 13 real-time threat signals (OTP/PIN phishing, identity switching, brute-force lookup, session velocity, abusive language).
   - Dynamic Honeypot Traps: planted fake triggers that issue instant session bans (Score 100).
   - Safe Key KYC Authentication with 3-attempt lockouts and identity mismatch protection.
   - Zero-PII storage: only stores `SHA-256` fingerprints in threat tables.

3. **👥 Multi-Agent Specialist Swarm (`backend/src/specialists.py`)**
   - Seamless zero-latency handoffs (`session.update_agent`) between:
     - **Jan Sahay Triage Assistant**
     - **Government Scheme Specialist**
     - **Digital Banking Safety Specialist**
     - **Bank Account Support Specialist**
   - Preserves complete conversational context without requiring the caller to repeat facts.

4. **🔒 Zero-PII-Leak Escalation & Ticket Pipeline (`backend/src/escalation.py`)**
   - Automated regex scrubbing for OTPs, PINs, passwords, and 16-digit card numbers.
   - Generates trackable tickets (`JS-XXXXXXX` / `TKT-XXXX`) with deduplication against active cases.

5. **📊 Sub-600ms Voice Telemetry & Analytics Dashboard (`backend/src/metrics.py` + `frontend/components/app/dashboard-view.tsx`)**
   - Live HTTP metrics server monitoring call outcomes, turn latencies, Murf Falcon TTFA (~240ms), and STT error rates.

---

## 🏗️ Architecture

![Jan Sahay System Architecture](docs/jan_sahay_architecture.jpg)

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

## 🚀 Quickstart

### 1. Prerequisites
- Python **3.10+** and [**uv**](https://docs.astral.sh/uv/)
- Node.js **18+** and **pnpm**
- API Keys: LiveKit, Murf Falcon, Deepgram, Google AI Studio / NVIDIA Nemotron

### 2. Environment Setup
```bash
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
```

Required keys in `backend/.env.local`:
```ini
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
MURF_API_KEY=your_murf_falcon_key
DEEPGRAM_API_KEY=your_deepgram_key
GOOGLE_API_KEY=your_gemini_key
```

### 3. Install & Run
```bash
# Backend setup
cd backend && uv sync && uv run python src/agent.py download-files

# Frontend setup
cd ../frontend && pnpm install

# Start all services (from root)
./start_app.sh
```

Open **`http://localhost:3000`** in your browser.

---

## 📊 10-Day Milestones Summary

| Day | Focus Area | What Was Shipped |
| :--- | :--- | :--- |
| **1** | Hello Voice Agent | LiveKit + Deepgram + Murf Falcon + LLM sub-second audio stream |
| **2** | Persona & Guardrails | Jan Sahay bilingual personality + strict anti-fraud safety guardrails |
| **3** | Audio Quality & UI | Murf Indian voice tuning, audio volume boost, live avatar visualizer |
| **4** | Caller Memory | Persistent SQLite caller memory, returning caller recognition, consent rules |
| **5** | Dynamic Tools | Eligibility calculator & document checklists for PMJDY, PMSBY, PMJJBY, APY |
| **6** | Flow Optimization | Deterministic save flow (`session.say + StopResponse`) without LLM hallucination |
| **7** | Escalations | Human escalation queue, automated ticket creation, PII sanitization |
| **8** | Citizen Portal | Call performance dashboard, latency telemetry, citizen status lookup |
| **9** | Multi-Agent Swarm | Domain specialist hierarchy & zero-latency stateful handoffs |
| **10**| Journey & Governance | Bank Manager Approval Portal, Threat Intelligence Engine & retrospective |

---

## 📜 License
MIT — see [LICENSE](LICENSE).

---
**Day 10 complete.** #10DaysOfAIVoiceAgents #VoiceForBharat #MurfFalcon
