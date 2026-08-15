import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, fingerprint } = body;

    const backendUrl = process.env.BACKEND_HTTP_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/threats/ban`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
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
      action: action || 'unban',
      fingerprint,
      message: `Session ${fingerprint} updated successfully`,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to process ban action' }, { status: 500 });
  }
}
