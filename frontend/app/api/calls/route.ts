import { NextResponse } from 'next/server';
import { proxyPost } from '@/lib/backend';
import { recordCallOutcome } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await proxyPost('/api/calls', body);
    if (result && result.ok) {
      return NextResponse.json(result.data);
    }

    const recorded = recordCallOutcome({
      call_id: body.room_id || body.call_id,
      channel: body.channel || 'browser',
      outcome: body.event === 'cancelled_before_connect' ? 'failed' : 'success',
      failure_type: body.event === 'cancelled_before_connect' ? 'cancelled_before_connect' : null,
      connected: body.event !== 'cancelled_before_connect',
      started_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, data: recorded });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }
}
