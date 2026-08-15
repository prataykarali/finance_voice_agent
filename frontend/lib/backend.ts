/**
 * Shared helper for proxying dashboard API routes to the always-on
 * voice-agent backend (LiveKit worker + metrics HTTP API on :8082).
 *
 * The backend cannot run on Vercel (it is a persistent WebSocket worker),
 * so every dashboard route proxies to BACKEND_HTTP_URL and falls back to an
 * honest empty payload when the backend is offline — never fake data.
 */

const rawUrl =
  process.env.BACKEND_HTTP_URL ||
  process.env.METRICS_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  '';

export const BACKEND_URL = rawUrl.replace(/\/+$/, '');
export const backendConfigured = BACKEND_URL.length > 0;

async function proxy(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response | null> {
  if (!backendConfigured) return null;
  const { timeoutMs = 8000, ...fetchInit } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...fetchInit,
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(fetchInit.body ? { 'Content-Type': 'application/json' } : {}),
        ...(fetchInit.headers || {}),
      },
    });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function proxyGet(pathWithQuery: string): Promise<unknown | null> {
  const res = await proxy(pathWithQuery);
  if (!res) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function proxyPost(
  path: string,
  body: unknown,
): Promise<{ ok: true; data: unknown } | { ok: false } | null> {
  const res = await proxy(path, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
  if (!res) return null;
  try {
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: true, data: {} };
  }
}

/** Wrap a backend payload so dashboards can show a live/offline badge. */
export function withStatus(data: unknown) {
  return { ...(data as Record<string, unknown>), backend_online: true };
}

export const offline = (extra: Record<string, unknown> = {}) => ({
  ...extra,
  backend_online: false,
});
