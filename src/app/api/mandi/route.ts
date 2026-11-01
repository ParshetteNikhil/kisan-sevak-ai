import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, AuthError } from '@/lib/server-auth';

/**
 * Today's mandi prices from Agmarknet (Ministry of Agriculture) via data.gov.in.
 * Looks in the farmer's district first, then their state, then the rest of India.
 * Prices are ₹ per quintal. No AI is used, so there is no AI quota involved.
 */
const RESOURCE = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
// data.gov.in's published sample key works (10 rows per call); set DATA_GOV_IN_API_KEY for full results.
const SAMPLE_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

// App crop key → Agmarknet commodity names.
const COMMODITY: Record<string, string[]> = {
  wheat: ['Wheat'],
  paddy: ['Paddy(Dhan)(Common)', 'Paddy(Dhan)(Basmati)', 'Rice'],
  cotton: ['Cotton'],
  soybean: ['Soyabean'],
  maize: ['Maize'],
  mustard: ['Mustard'],
  chana: ['Bengal Gram(Gram)(Whole)'],
  tur: ['Arhar (Tur/Red Gram)(Whole)'],
  groundnut: ['Groundnut'],
  sugarcane: ['Sugarcane'],
  onion: ['Onion'],
  potato: ['Potato'],
  tomato: ['Tomato'],
  chilli: ['Green Chilli', 'Dry Chillies'],
  bajra: ['Bajra(Pearl Millet/Cumbu)'],
};

export type MandiRow = { state: string; district: string; market: string; variety: string; date: string; min: number; max: number; modal: number };
export type MandiResult = { level: 'district' | 'state' | 'india' | 'none'; rows: MandiRow[] };

const CACHE_MS = 30 * 60 * 1000;
const cache = new Map<string, { at: number; body: MandiResult }>();

const title = (s: string) => s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

async function query(filters: Record<string, string>): Promise<MandiRow[]> {
  const url = new URL(RESOURCE);
  url.searchParams.set('api-key', process.env.DATA_GOV_IN_API_KEY || SAMPLE_KEY);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '50');
  for (const [k, v] of Object.entries(filters)) url.searchParams.set(`filters[${k}]`, v);
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`data.gov.in ${res.status}`);
  const j = await res.json();
  return (j.records || []).map((r: any) => ({
    state: r.state,
    district: r.district,
    market: r.market,
    variety: r.variety,
    date: r.arrival_date,
    min: Number(r.min_price),
    max: Number(r.max_price),
    modal: Number(r.modal_price),
  })).filter((r: MandiRow) => r.modal > 0);
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    await verifyIdToken(auth.startsWith('Bearer ') ? auth.slice(7) : null);

    const p = req.nextUrl.searchParams;
    const names = COMMODITY[p.get('crop') || ''];
    if (!names) return NextResponse.json({ error: 'Unknown crop' }, { status: 400 });
    const district = title((p.get('district') || '').slice(0, 60));
    const state = title((p.get('state') || '').slice(0, 60));

    const key = [p.get('crop'), district, state, new Date().toISOString().slice(0, 13)].join('|');
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return NextResponse.json(hit.body);

    const steps: [MandiResult['level'], Record<string, string>][] = [];
    if (district) steps.push(['district', { district }]);
    if (state) steps.push(['state', { 'state.keyword': state }]);
    steps.push(['india', {}]);

    let result: MandiResult = { level: 'none', rows: [] };
    for (const [level, f] of steps) {
      const rows = (await Promise.all(names.map((commodity) => query({ commodity, ...f })))).flat();
      if (rows.length) {
        rows.sort((a, b) => a.modal - b.modal);
        result = { level, rows: rows.slice(0, 12) };
        break;
      }
    }
    if (cache.size > 300) cache.delete(cache.keys().next().value as string);
    cache.set(key, { at: Date.now(), body: result });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('Mandi API error:', e);
    return NextResponse.json({ error: 'unavailable', code: 'busy' }, { status: 503 });
  }
}
