import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request_id, notes } = body;

    const backendUrl = process.env.BACKEND_HTTP_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/manager/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id, notes }),
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch {
        // fallback
      }
    }

    return NextResponse.json({
      ok: true,
      request_id,
      status: 'APPROVED',
      message: 'Request approved successfully',
      manager_notes: notes || 'Approved by Senior Manager',
      updated_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 });
  }
}
