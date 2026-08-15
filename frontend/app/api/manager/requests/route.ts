import { NextResponse } from 'next/server';
import { proxyGet } from '@/lib/backend';
import { getManagerRequests } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const qs = new URLSearchParams();
  if (status && status !== 'ALL') qs.set('status', status);
  if (type && type !== 'ALL') qs.set('type', type);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  const data = await proxyGet(`/api/manager/requests${suffix}`);
  if (Array.isArray(data) && data.length > 0) {
    return NextResponse.json(data);
  }
  return NextResponse.json(getManagerRequests(status || undefined, type || undefined));
}
