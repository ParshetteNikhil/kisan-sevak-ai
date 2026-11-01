import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, AuthError } from '@/lib/server-auth';

// data.gov.in's published sample key (10 rows per call) if our own key is not set.
const SAMPLE_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

/**
 * Gives signed-in users the data.gov.in key so the phone can fetch Agmarknet prices
 * directly (data.gov.in refuses connections from our cloud server).
 * The key only reads free public open data.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    await verifyIdToken(auth.startsWith('Bearer ') ? auth.slice(7) : null);
    return NextResponse.json({ key: (process.env.DATA_GOV_IN_API_KEY || SAMPLE_KEY).trim() }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
