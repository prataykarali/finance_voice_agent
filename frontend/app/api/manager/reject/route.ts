import { NextResponse } from 'next/server';
import { proxyPost } from '@/lib/backend';
import { rejectManagerRequest } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { request_id, notes } = await req.json();
    if (!request_id) {
      return NextResponse.json({ error: 'request_id is required' }, { status: 400 });
    }
    const result = await proxyPost('/api/manager/reject', { request_id, notes });
    if (result && result.ok) {
      return NextResponse.json(result.data);
    }

    const fallbackResult = rejectManagerRequest(request_id, notes);
    return NextResponse.json(fallbackResult);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reject request' }, { status: 500 });
  }
}
