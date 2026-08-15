# 🚀 Deploying Jan Sahay to Render with Docker

This guide explains how to deploy **Jan Sahay (जन सहाय)** — both the **Next.js 15 Web Portal** and the **Python LiveKit Voice Agent Worker** — to [**Render.com**](https://render.com) using Docker and Infrastructure-as-Code (`render.yaml`).

---

## 1. Quick Deploy via Render Blueprint (Recommended)

Render Blueprints allow you to provision the entire multi-container architecture in one click using [`render.yaml`](./render.yaml).

### Step 1: Fork or Push Repository to GitHub
Ensure your repository has the latest code with Dockerfiles:
```bash
git push origin day-10
```

### Step 2: Create a New Blueprint Instance on Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository (`finance_voice_agent`).
4. Select the branch (e.g. `day-10` or `main`).
5. Render will automatically detect [`render.yaml`](./render.yaml) and configure two services:
   - `jan-sahay-frontend` (Next.js Web Service on Docker)
   - `jan-sahay-backend` (Python Voice Agent & Metrics Web Service on Docker)

### Step 3: Set Secret Environment Variables in Render Dashboard
Under the Environment settings of your Blueprint, fill in your production API credentials:

| Environment Variable | Service | Description |
| :--- | :--- | :--- |
| `LIVEKIT_URL` | Frontend & Backend | Your LiveKit Cloud WebSocket URL (`wss://...`) |
| `LIVEKIT_API_KEY` | Frontend & Backend | Your LiveKit API Key |
| `LIVEKIT_API_SECRET` | Frontend & Backend | Your LiveKit API Secret |
| `MURF_API_KEY` | Backend | Your [Murf AI Falcon](https://murf.ai) API Key |
| `DEEPGRAM_API_KEY` | Backend | Your [Deepgram](https://deepgram.com) API Key |
| `GOOGLE_API_KEY` | Backend | Your [Google AI Studio](https://aistudio.google.com) API Key |
| `OPENAI_API_KEY` | Backend (Optional) | Your NVIDIA Nemotron / OpenAI API Key |

### Step 4: Click "Apply"
Render will build both Docker images, run health checks on `/healthz` and `/`, and launch your production voice AI application!

---

## 2. Manual Service Setup (Alternative)

If you prefer setting up services individually on Render:

### Service A: Voice Agent Backend (`jan-sahay-backend`)
1. **Type:** Web Service (or Background Worker)
2. **Environment:** Docker
3. **Dockerfile Path:** `./backend/Dockerfile`
4. **Docker Context:** `./backend`
5. **Health Check Path:** `/healthz`
6. **Port:** `8082`

### Service B: Next.js Web Frontend (`jan-sahay-frontend`)
1. **Type:** Web Service
2. **Environment:** Docker
3. **Dockerfile Path:** `./frontend/Dockerfile`
4. **Docker Context:** `./frontend`
5. **Health Check Path:** `/`
6. **Port:** `3000`
7. **Environment Variable:** `METRICS_ORIGIN=https://<your-backend-render-url>`

---

## 3. Local Docker Testing

Before pushing to Render, you can verify the multi-container setup locally:

```bash
# Build and start all containers
docker compose up --build

# Open frontend in browser
open http://localhost:3000

# Verify backend healthcheck
curl http://localhost:8082/healthz
```

---

## 4. Rate Limiting & Security Verification on Render

Once deployed on Render, verify that rate limiting and security headers are actively defending your endpoints:

```bash
# Run security test suite against your Render URL
FRONTEND_URL="https://jan-sahay-frontend.onrender.com" \
BACKEND_URL="https://jan-sahay-backend.onrender.com" \
./scripts/run_strix_security_check.sh
```
