import { NextResponse } from 'next/server';

interface MockManagerRequest {
  request_id: string;
  room_id: string;
  caller_name: string;
  request_type: 'ACCOUNT_CREATION' | 'TRANSACTION_TRANSFER' | 'LIMIT_OVERRIDE';
  details: {
    phone?: string;
    safe_key_hint?: string;
    target_beneficiary?: string;
    target_account_last4?: string;
    amount?: number;
    reason?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  manager_notes?: string;
}

// In-memory persistent queue for Vercel demo
let mockRequests: MockManagerRequest[] = [
  {
    request_id: 'REQ-MGR-948102',
    room_id: 'call_room_b72a819c',
    caller_name: 'Anjali Deshmukh',
    request_type: 'ACCOUNT_CREATION',
    details: {
      phone: '+91 98201 44521',
      safe_key_hint: 'ANJ***',
      reason: 'New Citizen Jan Sahay Profile Activation with Safe Key verification',
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    request_id: 'REQ-MGR-318490',
    room_id: 'call_room_f4309e11',
    caller_name: 'Rajesh Kumar Verma',
    request_type: 'TRANSACTION_TRANSFER',
    details: {
      target_beneficiary: 'Priya Sharma (Punjab National Bank)',
      target_account_last4: '8834',
      amount: 45000,
      reason: 'High-value educational fund transfer requiring Manager authorization',
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 42 * 60000).toISOString(),
  },
  {
    request_id: 'REQ-MGR-104928',
    room_id: 'call_room_901d84fa',
    caller_name: 'Vikramaditya Roy',
    request_type: 'TRANSACTION_TRANSFER',
    details: {
      target_beneficiary: 'Self (HDFC Bank)',
      target_account_last4: '1902',
      amount: 120000,
      reason: 'Emergency hospital deposit transfer approved with biometric audit',
    },
    status: 'APPROVED',
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    manager_notes: 'Approved after two-party verification check',
  },
];

export async function GET(req: Request) {
  const backendUrl = process.env.BACKEND_HTTP_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    try {
      const url = new URL(req.url);
      const res = await fetch(`${backendUrl}/api/manager/requests?${url.searchParams.toString()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // fallback
    }
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  let results = [...mockRequests];
  if (status && status !== 'ALL') {
    results = results.filter((r) => r.status.toUpperCase() === status.toUpperCase());
  }
  if (type && type !== 'ALL') {
    results = results.filter((r) => r.request_type.toUpperCase() === type.toUpperCase());
  }

  return NextResponse.json(results);
}
