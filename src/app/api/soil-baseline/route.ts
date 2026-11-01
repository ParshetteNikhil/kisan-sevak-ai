import { NextRequest, NextResponse } from 'next/server';
import { soilBaseline } from '@/lib/soil-baseline';

/** Public government soil statistics for a district (no personal data). */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const state = (p.get('state') || '').slice(0, 60);
  const places = (p.get('place') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (!state) return NextResponse.json({ error: 'state required' }, { status: 400 });
  try {
    const b = await soilBaseline(state, places);
    return NextResponse.json(b, { headers: { 'Cache-Control': 'public, max-age=86400' } });
  } catch (e) {
    console.error('Soil baseline error:', e);
    return NextResponse.json(null, { status: 503 });
  }
}
