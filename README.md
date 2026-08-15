# Jan Sahay (जन सहाय) — Enterprise Voice AI Agent for Bharat (Day 10)

**Jan Sahay (जन सहाय)** is a production-grade, bilingual voice AI companion for **financial literacy, government scheme navigation, fraud protection, and citizen support in India**. Powered by **Murf Falcon TTS** and **LiveKit Agents**, it explains national social welfare schemes (PMJDY, PMSBY, PMJJBY, APY), computes eligibility, generates document checklists, handles real-time human escalations, detects fraud with a custom threat intelligence engine, and provides an enterprise **Bank Manager Approval Portal**.

Built for **#10DaysOfAIVoiceAgents** / **#VoiceForBharat** using [Murf Falcon Streaming TTS](https://murf.ai) + [LiveKit Agents](https://docs.livekit.io/agents).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Murf Falcon](https://img.shields.io/badge/TTS-Murf%20Falcon%20(Fastest)-6366F1)](https://murf.ai/api/docs/text-to-speech/streaming)
[![LiveKit](https://img.shields.io/badge/Transport-LiveKit%20WebRTC-002cf2)](https://docs.livekit.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](./docker-compose.yml)
[![Render](https://img.shields.io/badge/Deploy%20to-Render-46E3B7?logo=render&logoColor=white)](./RENDER_DEPLOYMENT.md)
[![Strix Security](https://img.shields.io/badge/Security-Strix%20AI%20Audited-red)](https://github.com/usestrix/strix)

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

5. **⚡ IP Rate Limiting & Strix Security Audit Protection (`frontend/app/api/token/route.ts`)**
   - In-memory sliding window rate limiter (20 token requests/min/IP) returning `HTTP 429 Too Many Requests`.
   - Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Cache-Control: no-store`.
   - Integrated with [Strix](https://github.com/usestrix/strix.git) for automated AI penetration testing.

6. **📊 Sub-600ms Voice Telemetry & Analytics Dashboard (`backend/src/metrics.py` + `frontend/components/app/dashboard-view.tsx`)**
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

## 🚀 Deployment

### Option 1: Deploy to Render with Docker (`render.yaml`)
Jan Sahay includes a complete [**Render Blueprint**](./render.yaml) for zero-config multi-service deployment.

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **Blueprint**.
2. Connect your GitHub repository: `https://github.com/prataykarali/finance_voice_agent`.
3. Set your production secrets (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `MURF_API_KEY`, `DEEPGRAM_API_KEY`, `GOOGLE_API_KEY`).
4. Click **Apply**. Render will automatically build the multi-stage Docker containers and deploy both the Web Portal and the Voice Agent Worker!

See [**`RENDER_DEPLOYMENT.md`**](./RENDER_DEPLOYMENT.md) for full instructions.

### Option 2: Run with Docker Compose
```bash
# Clone the repository
git clone https://github.com/prataykarali/finance_voice_agent.git
cd finance_voice_agent

# Ensure environment keys are populated in backend/.env.local and frontend/.env.local
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local

# Build and start all services with Docker
docker compose up --build
```
Open **`http://localhost:3000`** in your browser.

---

## 🛡️ Security & Rate Limiting Audit with Strix

Jan Sahay uses [**Strix**](https://github.com/usestrix/strix.git) (`usestrix/strix`) for autonomous AI penetration testing, rate limiting checks, and security auditing.

### Run Automated Security Suite:
```bash
./scripts/run_strix_security_check.sh
```

### Run Strix Autonomous AI Pentest:
```bash
git clone https://github.com/usestrix/strix.git /tmp/strix-scanner
pip install -r /tmp/strix-scanner/requirements.txt
python -m strix --config strix.config.yaml --target http://localhost:3000
```
See [**`STRIX_SECURITY.md`**](./STRIX_SECURITY.md) for the detailed threat models and audit logs.

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
| **10**| Journey & Governance | Render Dockerization, Strix AI Security Auditor, Manager Portal & retrospective |

---

## 📜 License
MIT — see [LICENSE](LICENSE).

---
**Day 10 complete.** #10DaysOfAIVoiceAgents #VoiceForBharat #MurfFalcon #Render #Docker #Strix
