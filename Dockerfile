# Root Dockerfile for Back4App / container platforms
# Builds the Python LiveKit Voice Agent from backend/ directory

ARG PYTHON_VERSION=3.13
FROM ghcr.io/astral-sh/uv:python${PYTHON_VERSION}-bookworm-slim AS base

ENV PYTHONUNBUFFERED=1

# --- Build stage ---
FROM base AS build

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files from backend/
COPY backend/pyproject.toml backend/uv.lock ./
RUN mkdir -p src

# Install dependencies
RUN uv sync --locked

# Copy backend source code
COPY backend/src/ ./src/

# Pre-download ML models (Silero VAD)
RUN uv run "src/agent.py" download-files

# --- Production stage ---
FROM base

ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/app" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    appuser

COPY --from=build --chown=appuser:appuser /app /app

USER appuser
WORKDIR /app

ENV METRICS_HOST="0.0.0.0"
ENV METRICS_PORT=8082
EXPOSE 8082

CMD ["uv", "run", "src/agent.py", "start"]
