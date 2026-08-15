import { NextResponse } from 'next/server';
import { proxyPost } from '@/lib/backend';
import { banFingerprint, unbanFingerprint } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.fingerprint) {
      return NextResponse.json({ error: 'fingerprint is required' }, { status: 400 });
    }
    const result = await proxyPost('/api/threats/ban', body);
    if (result && result.ok) {
      return NextResponse.json(result.data);
    }

    if (body.action === 'unban') {
      const res = unbanFingerprint(body.fingerprint);
      return NextResponse.json(res);
    } else {
      const res = banFingerprint(body.fingerprint, body.reason);
      return NextResponse.json(res);
    }
  } catch {
    return NextResponse.json({ error: 'Failed to process ban action' }, { status: 500 });
  }
}
