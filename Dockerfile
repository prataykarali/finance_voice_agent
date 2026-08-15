# Root Dockerfile for container platforms (Back4App, Render, Railway, etc.)
# Builds and runs the Python LiveKit Voice Agent Worker from the backend/ directory.

# syntax=docker/dockerfile:1

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

# Copy backend dependency files first for layer caching
COPY backend/pyproject.toml backend/uv.lock ./
RUN mkdir -p src

# Install Python dependencies
RUN uv sync --locked

# Copy all backend source code
COPY backend/ .

# Pre-download ML models (Silero VAD, etc.)
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

# Back4App exposes port via $PORT env var; default to 8082 for health checks
ENV METRICS_HOST="0.0.0.0"
ENV METRICS_PORT=8082
EXPOSE 8082

# Start the LiveKit Agent Worker — connects to LiveKit Cloud and answers calls 24/7
CMD ["uv", "run", "src/agent.py", "start"]
