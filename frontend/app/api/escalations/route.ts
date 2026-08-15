import { NextResponse } from 'next/server';

interface MockEscalation {
  reference_id: string;
  user_id: string;
  requester_name: string;
  contact_hint: string;
  trigger_type: string;
  issue_description: string;
  status: string;
  urgency: string;
  preferred_language: string;
  created_at: string;
}

let inMemoryEscalations: MockEscalation[] = [
  {
    reference_id: 'JS-894721',
    user_id: 'ramesh_kumar',
    requester_name: 'Ramesh Chandra Kumar',
    contact_hint: '9845XXXXXX',
    trigger_type: 'complex_decision',
    issue_description:
      'Denied PM Suraksha Bima Yojana due to age limit confusion (citizen is 64 years old, eligible under 18-70 bracket).',
    status: 'open',
    urgency: 'high',
    preferred_language: 'hi',
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
  },
  {
    reference_id: 'JS-384119',
    user_id: 'sunita_sharma',
    requester_name: 'Sunita Devi Sharma',
    contact_hint: '7829XXXXXX',
    trigger_type: 'fraud_suspected',
    issue_description:
      'Received phishing SMS asking to share UPI PIN for APY pension credit of Rs. 5,000. Potential fraud attack prevented.',
    status: 'resolved',
    urgency: 'emergency',
    preferred_language: 'hi',
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
];

export async function GET() {
  const backendUrl = process.env.BACKEND_HTTP_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/escalations`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // fallback to in-memory store
    }
  }

  return NextResponse.json(inMemoryEscalations);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newEscalation: MockEscalation = {
      reference_id: `JS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      user_id: body.user_id || 'caller',
      requester_name: body.requester_name || 'Caller',
      contact_hint: body.contact_hint || 'Direct voice session',
      trigger_type: body.trigger_type || 'fraud_suspected',
      issue_description: body.issue_description || 'Security incident reported on live call',
      status: 'open',
      urgency: body.urgency || 'emergency',
      preferred_language: body.preferred_language || 'en',
      created_at: new Date().toISOString(),
    };

    inMemoryEscalations.unshift(newEscalation);
    return NextResponse.json({ ok: true, reference_id: newEscalation.reference_id });
  } catch {
    return NextResponse.json({ error: 'Failed to create escalation' }, { status: 500 });
  }
}
