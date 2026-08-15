import { NextResponse } from 'next/server';

let inMemorySecurityData = {
  stats: {
    total_events: 18,
    active_bans: 1,
    avg_threat_score: 14.2,
    max_threat_score: 85.0,
    restricted_sessions_count: 2,
  },
  recent_threats: [
    {
      timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
      room_id: 'call_room_7a9f1234',
      threat_score: 85.0,
      threat_level: 'critical',
      detected_flags: ['rapid_otp_harvesting', 'prompt_injection_attempt'],
      action_taken: 'SESSION_TERMINATED_AND_FINGERPRINT_BANNED',
      session_fingerprint: 'fp_9a8b7c6d5e4f3a2b',
    },
    {
      timestamp: new Date(Date.now() - 19 * 60000).toISOString(),
      room_id: 'call_room_3b2e9811',
      threat_score: 42.0,
      threat_level: 'medium',
      detected_flags: ['unusual_caller_frequency', 'unverified_safe_key_retry'],
      action_taken: 'ROUTED_TO_DIGITAL_SAFETY_SPECIALIST',
      session_fingerprint: 'fp_1122334455667788',
    },
  ],
  active_bans: [
    {
      fingerprint: 'fp_9a8b7c6d5e4f3a2b',
      banned_at: new Date(Date.now() - 4 * 60000).toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      reason: 'Malicious OTP exploitation probe detected by Strix threat engine',
      is_permanent: false,
    },
  ],
  specialist_activity: {
    digital_safety: 7,
  },
};

export async function GET(req: Request) {
  const backendUrl = process.env.BACKEND_HTTP_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    try {
      const url = new URL(req.url);
      const res = await fetch(`${backendUrl}/api/security?${url.searchParams.toString()}`, {
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

  return NextResponse.json(inMemorySecurityData);
}
