import { NextResponse } from 'next/server';
import { proxyGet, withStatus } from '@/lib/backend';

export const dynamic = 'force-dynamic';

const DEFAULT_SECURITY_PAYLOAD = {
  stats: {
    total_threat_events: 3,
    affected_sessions: 2,
    avg_threat_score: 28,
    max_threat_score: 65,
    ban_events: 1,
    restrict_events: 1,
    warn_events: 1,
    monitor_events: 2,
    active_bans: 1,
    signal_distribution: {
      'Rapid OTP Probing': 1,
      'Aadhaar Pattern Extraction': 1,
      'Suspicious Session Jitter': 1,
    },
  },
  recent_threats: [
    {
      event_id: 'EVT-SEC-8921',
      room_id: 'room_sec_9912',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      threat_score: 65,
      threat_level: 'restrict',
      signals: ['Rapid OTP Probing', 'Aggressive Prompt Jitter'],
      action_taken: 'Session restricted and transferred to Digital Banking Safety Specialist',
      details: { ip: '203.0.113.88', attempts: 3 },
    },
    {
      event_id: 'EVT-SEC-4120',
      room_id: 'room_sec_3301',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      threat_score: 30,
      threat_level: 'warn',
      signals: ['Suspicious Account Number Pattern Extraction'],
      action_taken: 'Warning issued & PII filter engaged',
      details: { ip: '198.51.100.14' },
    },
  ],
  active_bans: [
    {
      fingerprint: 'fp_ip_203_0_113_45',
      room_id: 'room_sec_badactor',
      banned_at: new Date(Date.now() - 86400000).toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 6).toISOString(),
      reason: 'Automated brute force attempt on Safe Keys',
      total_threat_score: 95,
      is_permanent: false,
    },
  ],
  specialist_activity: {
    digital_safety: 12,
  },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const data = await proxyGet(`/api/security${qs ? `?${qs}` : ''}`);
  if (data) {
    return NextResponse.json(withStatus(data));
  }
  return NextResponse.json({
    ...DEFAULT_SECURITY_PAYLOAD,
    backend_online: false,
  });
}
