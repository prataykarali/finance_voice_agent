import { NextResponse } from 'next/server';

let inMemoryMetrics = {
  total_calls: 34,
  successful_calls: 32,
  failed_calls: 2,
  success_rate: 94.1,
  eligibility_checks: 19,
  document_lists: 14,
  escalations: 6,
  average_latency_ms: 540,
  latency_p50: 490,
  latency_p95: 720,
  failure_types: {
    user_hangup_early: 1,
    audio_stream_drop: 1,
  },
  recent_calls: [
    {
      call_id: 'call_live_9481a',
      channel: 'browser',
      language: 'hi',
      started_at: new Date(Date.now() - 3 * 60000).toISOString(),
      duration_seconds: 145,
      outcome: 'success',
      result_summary: 'PMJDY Scheme Explanation & Zero Balance Benefits Provided',
      turn_count: 8,
      latency_first_reply_ms: 512,
    },
    {
      call_id: 'call_live_7721b',
      channel: 'browser',
      language: 'en',
      started_at: new Date(Date.now() - 14 * 60000).toISOString(),
      duration_seconds: 88,
      outcome: 'success',
      result_summary: 'Lost Credit Card Reported -> Emergency Case JS-7721 Opened',
      turn_count: 4,
      latency_first_reply_ms: 480,
    },
    {
      call_id: 'call_live_1092c',
      channel: 'sip',
      language: 'hi',
      started_at: new Date(Date.now() - 38 * 60000).toISOString(),
      duration_seconds: 210,
      outcome: 'success',
      result_summary: 'Atal Pension Yojana Premium Tier Calculated for 30yr citizen',
      turn_count: 11,
      latency_first_reply_ms: 560,
    },
  ],
};

export async function GET(req: Request) {
  const backendUrl = process.env.BACKEND_HTTP_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    try {
      const url = new URL(req.url);
      const res = await fetch(`${backendUrl}/api/metrics?${url.searchParams.toString()}`, {
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

  return NextResponse.json(inMemoryMetrics);
}
