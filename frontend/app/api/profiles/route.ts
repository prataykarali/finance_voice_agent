import { NextResponse } from 'next/server';
import { getProfiles, createProfile } from '@/lib/store';
import { proxyGet, proxyPost } from '@/lib/backend';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q') || searchParams.get('search') || undefined;

  // Try proxy first if backend is running
  const proxied = await proxyGet(`/api/profiles${search ? `?q=${encodeURIComponent(search)}` : ''}`);
  if (proxied && Array.isArray(proxied)) {
    return NextResponse.json(proxied);
  }

  // Fallback to reactive store
  const profiles = getProfiles(search);
  return NextResponse.json(profiles);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Try proxy first
    const proxied = await proxyPost('/api/profiles', body);
    if (proxied && proxied.ok) {
      return NextResponse.json(proxied.data);
    }

    // Fallback to store
    const profile = createProfile({
      name: body.name,
      phone: body.phone,
      language_preference: body.language_preference,
      balance_inr: body.balance_inr ? Number(body.balance_inr) : undefined,
      safe_key: body.safe_key,
      kyc_status: body.kyc_status || 'VERIFIED',
      facts: body.facts,
    });

    return NextResponse.json({
      ok: true,
      profile,
      message: `Caller profile for ${profile.name} created successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create profile' }, { status: 500 });
  }
}
