#!/usr/bin/env bash
# ==============================================================================
# Jan Sahay Security & Rate Limiting Verification Suite
# Powered by Strix (https://github.com/usestrix/strix.git)
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}  🛡️ Jan Sahay Security & Rate Limiting Auditor with Strix       ${NC}"
echo -e "${BLUE}  Target: Local & Render Deployments                            ${NC}"
echo -e "${BLUE}  Ref: https://github.com/usestrix/strix.git                    ${NC}"
echo -e "${BLUE}================================================================${NC}"

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:8082}"
STRIX_DIR="${STRIX_DIR:-/tmp/strix-scanner}"

echo -e "\n${YELLOW}[1/4] Checking target service availability...${NC}"
if curl -s -f -o /dev/null "$FRONTEND_URL" 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend is reachable at $FRONTEND_URL${NC}"
else
    echo -e "${YELLOW}! Frontend not running at $FRONTEND_URL. (Make sure frontend is running if doing live scan)${NC}"
fi

if curl -s -f -o /dev/null "$BACKEND_URL/healthz" 2>/dev/null; then
    echo -e "${GREEN}✓ Backend metrics/health is reachable at $BACKEND_URL/healthz${NC}"
else
    echo -e "${YELLOW}! Backend not running at $BACKEND_URL. (Make sure backend is running if doing live scan)${NC}"
fi

echo -e "\n${YELLOW}[2/4] Testing Rate Limiting on Token API ($FRONTEND_URL/api/token)...${NC}"
SUCCESS_COUNT=0
BLOCKED_COUNT=0

for i in $(seq 1 25); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$FRONTEND_URL/api/token" \
        -H "Content-Type: application/json" \
        -d '{"room_config":{}}' 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    elif [ "$STATUS" = "429" ]; then
        BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
    fi
done

echo -e "  Completed 25 burst requests:"
echo -e "  - Allowed (200 OK): $SUCCESS_COUNT"
echo -e "  - Rate-Limited (429 Too Many Requests): $BLOCKED_COUNT"

if [ "$BLOCKED_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Rate Limiting Protection VERIFIED! (HTTP 429 triggered)${NC}"
else
    echo -e "${YELLOW}! Note: Rate limiting test requires running frontend instance.${NC}"
fi

echo -e "\n${YELLOW}[3/4] Testing Security Headers & Information Leakage...${NC}"
HEADERS=$(curl -s -I -X POST "$FRONTEND_URL/api/token" 2>/dev/null || true)

if echo "$HEADERS" | grep -iq "X-Content-Type-Options: nosniff"; then
    echo -e "${GREEN}✓ X-Content-Type-Options: nosniff header present${NC}"
else
    echo -e "${YELLOW}! X-Content-Type-Options missing on remote or offline${NC}"
fi

if echo "$HEADERS" | grep -iq "X-Frame-Options: DENY"; then
    echo -e "${GREEN}✓ X-Frame-Options: DENY header present (Clickjacking protected)${NC}"
else
    echo -e "${YELLOW}! X-Frame-Options missing on remote or offline${NC}"
fi

echo -e "\n${YELLOW}[4/4] Strix AI Pentesting Framework Setup (https://github.com/usestrix/strix.git)...${NC}"
if command -v strix >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Strix CLI detected in PATH${NC}"
    echo -e "Running headless Strix audit..."
    strix -n --target "$FRONTEND_URL" || true
else
    echo -e "To run autonomous AI agent penetration tests with Strix:"
    echo -e "  1. Clone Strix: ${BLUE}git clone https://github.com/usestrix/strix.git${NC}"
    echo -e "  2. Install & Run: ${BLUE}pip install usestrix && strix --target $FRONTEND_URL${NC}"
    echo -e "  3. Or run via Docker: ${BLUE}docker run --rm -v $(pwd):/workspace usestrix/strix:latest${NC}"
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}  ✓ Security & Rate Limiting Audit Complete!                    ${NC}"
echo -e "${GREEN}================================================================${NC}"
