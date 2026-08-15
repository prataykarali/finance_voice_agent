import { NextResponse } from 'next/server';
import { proxyGet, withStatus } from '@/lib/backend';
import { getMetrics } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get('channel') || undefined;
  const since = searchParams.get('since') || undefined;

  const qs = searchParams.toString();
  const data = await proxyGet(`/api/metrics${qs ? `?${qs}` : ''}`);
  if (data) {
    return NextResponse.json(withStatus(data));
  }

  // Fallback to in-memory reactive store
  const storeMetrics = getMetrics(channel, since);
  return NextResponse.json({
    ...storeMetrics,
    backend_online: false,
  });
}
