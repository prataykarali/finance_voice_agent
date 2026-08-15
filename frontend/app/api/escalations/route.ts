import { NextResponse } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/backend';
import { getEscalations, createEscalation } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await proxyGet('/api/escalations');
  if (Array.isArray(data) && data.length > 0) {
    return NextResponse.json(data);
  }
  return NextResponse.json(getEscalations());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.issue_description || !body.issue_description.trim()) {
      return NextResponse.json(
        { error: 'issue_description is required' },
        { status: 400 },
      );
    }

    const result = await proxyPost('/api/escalations', body);
    if (result && result.ok) {
      return NextResponse.json(result.data);
    }

    // Fallback to in-memory serverless store
    const ticket = createEscalation({
      user_id: body.user_id,
      requester_name: body.requester_name,
      contact_hint: body.contact_hint,
      issue_description: body.issue_description,
      category: body.category,
      trigger_type: body.trigger_type,
      urgency: body.urgency,
      preferred_language: body.preferred_language,
    });

    return NextResponse.json({
      ok: true,
      reference_id: ticket.reference_id,
      status: ticket.status,
      ticket,
      message: `Escalation ticket ${ticket.reference_id} assigned to ${ticket.nodal_officer}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create escalation' },
      { status: 500 },
    );
  }
}
