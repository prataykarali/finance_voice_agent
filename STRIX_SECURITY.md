# 🛡️ Strix Security & Rate Limiting Verification Suite for Jan Sahay

This document describes the autonomous AI penetration testing, rate limiting, and security validation architecture for **Jan Sahay (जन सहाय)** using [**Strix**](https://github.com/usestrix/strix.git) (`usestrix/strix`).

---

## 1. Overview of Strix Security Architecture

[**Strix**](https://github.com/usestrix/strix.git) is an open-source, autonomous AI-powered penetration testing and security assessment framework. It simulates real-world attacker behavior by actively investigating attack surfaces, attempting proof-of-concept exploits in sandboxed environments, and validating defenses against:

1. **Denial of Service & Token Exhaustion Attacks (Rate Limiting)**
2. **PII and Secret Data Leaks (OTP, UPI PIN, Aadhaar, Bank Credentials)**
3. **Prompt Injection & Persona Jailbreaks**
4. **Honeypot Trap Detection & Automatic Session Banning**
5. **Manager Portal Privilege Escalation & State Tampering**

```
┌────────────────────────────────────────────────────────────────────────┐
│               STRIX AUTONOMOUS AI SECURITY SCANNER                      │
│                (https://github.com/usestrix/strix.git)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼───────────────────────────┐
       ▼                            ▼                           ▼
┌─────────────────┐        ┌──────────────────┐        ┌─────────────────┐
│  Rate Limiting  │        │  Threat Engine   │        │ PII Sanitization│
│  Burst Testing  │        │  Honeypot Probes │        │ & Leak Defense  │
└────────┬────────┘        └────────┬─────────┘        └────────┬────────┘
         │                          │                           │
         ▼                          ▼                           ▼
┌─────────────────┐        ┌──────────────────┐        ┌─────────────────┐
│ Next.js Token   │        │ Threat Scoring & │        │ Escalations &   │
│ Endpoint (:3000)│        │ Auto-Ban (:8082) │        │ DB Storage      │
│ [HTTP 429 Limit]│        │ [Instant Ban]    │        │ [Scrubbed Logs] │
└─────────────────┘        └──────────────────┘        └─────────────────┘
```

---

## 2. Hardened Security Defenses in Jan Sahay

### A. IP-Based Sliding Window Rate Limiting (`/api/token`)
- **Capacity:** 20 token minting requests per IP per 60-second window.
- **Enforcement:** In-memory sliding window queue.
- **Headers:** Automatically provides standard RFC-compliant rate limit telemetry:
  - `X-RateLimit-Limit: 20`
  - `X-RateLimit-Remaining: <count>`
  - `X-RateLimit-Reset: <seconds>`
  - `Retry-After: <seconds>`
- **Response:** On exhaustion, returns `HTTP 429 Too Many Requests` with a descriptive JSON payload, protecting against LiveKit room spam and token exhaustion.

### B. Metrics & Management Rate Limiting (`:8082`)
- **Capacity:** 60 requests per minute per IP on backend HTTP endpoints.
- **Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Cache-Control: no-store`.
- **Health Check Exemption:** `/healthz` and `/api/health` remain unthrottled for Render and Kubernetes readiness probes.

### C. Multi-Signal Threat Intelligence Engine (`threat_engine.py`)
- **13 Behavioral Signals:** Evaluates identity switching, brute-force scheme lookups, rapid-fire turns, abusive language, and OTP phishing.
- **Dynamic Honeypots:** Planted honeypot cues instantly trigger a permanent or TTL-based session ban with Score 100.
- **Safe Key KYC Protection:** Identity-mismatched Safe Key attempts trigger escalating threat penalties and lock after 3 failed attempts.

### D. Zero-PII Escalation & Storage Pipeline (`escalation.py`)
- Regex sanitizers strip all sensitive patterns before any escalation ticket or database write:
  - OTPs, PINs, Passwords, CVVs (`[redacted]`)
  - 12-digit Aadhaar numbers (`[redacted]`)
  - 16-digit Debit/Credit Card numbers (`[redacted]`)

---

## 3. Running Strix Security Audits

### Method 1: Using the Built-In Security Verification Script
Run the automated rate-limit and header security test:
```bash
./scripts/run_strix_security_check.sh
```

### Method 2: Running Strix Headless AI Pentest
Clone and run Strix directly against your local or Render deployment:

```bash
# 1. Clone Strix framework
git clone https://github.com/usestrix/strix.git /tmp/strix-scanner
cd /tmp/strix-scanner

# 2. Install dependencies
pip install -r requirements.txt

# 3. Execute autonomous security scan against Jan Sahay
python -m strix --config /path/to/strix.config.yaml --target http://localhost:3000
```

### Method 3: Running via Docker
```bash
docker run --rm -it \
  -v $(pwd)/strix.config.yaml:/workspace/strix.config.yaml \
  --network host \
  usestrix/strix:latest \
  --config /workspace/strix.config.yaml
```

---

## 4. Strix Target Configuration Reference (`strix.config.yaml`)

```yaml
version: "1.0"
project_name: "jan-sahay-voice-agent"

targets:
  - name: "frontend-token-api"
    url: "http://localhost:3000/api/token"
    method: "POST"
    checks:
      - "rate_limiting"
      - "dos_burst_resistance"
      - "security_headers"

  - name: "backend-metrics-api"
    url: "http://localhost:8082/api/metrics"
    method: "GET"
    checks:
      - "rate_limiting"
      - "pii_leak_verification"

rules:
  rate_limit:
    max_requests_per_minute: 20
    expected_status_on_exhaustion: 429
```

---

## 5. Security Checklist for Production (Render & Cloud)

- [x] **Rate Limiting:** Token route throttled at 20 req/min/IP with HTTP 429 responses.
- [x] **Security Headers:** `nosniff`, `DENY` clickjacking protection, and `no-store` caches enabled.
- [x] **Zero PII Logging:** No transcripts or raw OTPs stored in database.
- [x] **Honeypot Defense:** Automated instant ban on unauthorized prompt probing.
- [x] **CI/CD Integration:** Automated Strix security auditing in GitHub Actions.
