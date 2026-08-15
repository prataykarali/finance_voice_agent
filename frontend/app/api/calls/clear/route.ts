import { NextResponse } from 'next/server';
import { proxyPost } from '@/lib/backend';
import { clearCalls } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST() {
  const result = await proxyPost('/api/calls/clear', {});
  clearCalls();
  if (result && result.ok) {
    return NextResponse.json(result.data);
  }
  return NextResponse.json({ status: 'success', message: 'Call outcomes cleared' });
}
