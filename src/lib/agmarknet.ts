/**
 * Today's mandi prices from Agmarknet (Ministry of Agriculture) via data.gov.in.
 * Runs in the farmer's browser: data.gov.in refuses connections from our cloud
 * server (outside India), but phones in India can reach it directly.
 * Prices are ₹ per quintal.
 */
const RESOURCE = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

// App crop key → Agmarknet commodity names.
export const COMMODITY: Record<string, string[]> = {
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

const STATES = [
  'Andaman and Nicobar', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'NCT of Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export type MandiRow = { state: string; district: string; market: string; variety: string; date: string; min: number; max: number; modal: number; km?: number };
export type MandiResult = { level: 'near' | 'far' | 'district' | 'state' | 'india' | 'none'; rows: MandiRow[]; place?: string };

const title = (s: string) => s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const squash = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/district/g, '').replace(/[^a-z]/g, '');

// Agmarknet's own spellings of some states.
const STATE_ALIAS: Record<string, string> = {
  chhattisgarh: 'Chattisgarh', delhi: 'NCT of Delhi', nationalcapitalterritoryofdelhi: 'NCT of Delhi', nctofdelhi: 'NCT of Delhi',
  orissa: 'Odisha', uttaranchal: 'Uttarakhand', pondicherry: 'Puducherry',
};
const agState = (s: string) => STATE_ALIAS[squash(s)] || title(s).replace(/ And /g, ' and ').replace(/ Of /g, ' of ');

// Neighbouring states, so mandis just across a border are included.
const NEIGHBOURS: Record<string, string[]> = {
  'Andhra Pradesh': ['Telangana', 'Karnataka', 'Tamil Nadu', 'Odisha', 'Chattisgarh'],
  'Arunachal Pradesh': ['Assam', 'Nagaland'],
  Assam: ['Arunachal Pradesh', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Meghalaya', 'West Bengal'],
  Bihar: ['Uttar Pradesh', 'Jharkhand', 'West Bengal'],
  Chattisgarh: ['Madhya Pradesh', 'Maharashtra', 'Telangana', 'Andhra Pradesh', 'Odisha', 'Jharkhand', 'Uttar Pradesh'],
  Goa: ['Maharashtra', 'Karnataka'],
  Gujarat: ['Rajasthan', 'Madhya Pradesh', 'Maharashtra'],
  Haryana: ['Punjab', 'Himachal Pradesh', 'Rajasthan', 'Uttar Pradesh', 'NCT of Delhi', 'Chandigarh', 'Uttarakhand'],
  'Himachal Pradesh': ['Jammu and Kashmir', 'Punjab', 'Haryana', 'Uttarakhand', 'Chandigarh'],
  Jharkhand: ['Bihar', 'West Bengal', 'Odisha', 'Chattisgarh', 'Uttar Pradesh'],
  Karnataka: ['Maharashtra', 'Goa', 'Kerala', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana'],
  Kerala: ['Karnataka', 'Tamil Nadu'],
  'Madhya Pradesh': ['Rajasthan', 'Uttar Pradesh', 'Chattisgarh', 'Maharashtra', 'Gujarat'],
  Maharashtra: ['Gujarat', 'Madhya Pradesh', 'Chattisgarh', 'Telangana', 'Karnataka', 'Goa'],
  Manipur: ['Nagaland', 'Mizoram', 'Assam'],
  Meghalaya: ['Assam'],
  Mizoram: ['Assam', 'Manipur', 'Tripura'],
  Nagaland: ['Assam', 'Arunachal Pradesh', 'Manipur'],
  Odisha: ['West Bengal', 'Jharkhand', 'Chattisgarh', 'Andhra Pradesh'],
  Punjab: ['Haryana', 'Himachal Pradesh', 'Rajasthan', 'Jammu and Kashmir', 'Chandigarh'],
  Rajasthan: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Gujarat'],
  Sikkim: ['West Bengal'],
  'Tamil Nadu': ['Kerala', 'Karnataka', 'Andhra Pradesh', 'Puducherry'],
  Telangana: ['Maharashtra', 'Chattisgarh', 'Andhra Pradesh', 'Karnataka'],
  Tripura: ['Assam', 'Mizoram'],
  'Uttar Pradesh': ['Uttarakhand', 'Himachal Pradesh', 'Haryana', 'NCT of Delhi', 'Rajasthan', 'Madhya Pradesh', 'Chattisgarh', 'Jharkhand', 'Bihar'],
  Uttarakhand: ['Himachal Pradesh', 'Uttar Pradesh', 'Haryana'],
  'West Bengal': ['Sikkim', 'Assam', 'Bihar', 'Jharkhand', 'Odisha'],
  'NCT of Delhi': ['Haryana', 'Uttar Pradesh'],
  'Jammu and Kashmir': ['Himachal Pradesh', 'Punjab'],
  Chandigarh: ['Punjab', 'Haryana'],
  Puducherry: ['Tamil Nadu'],
};

/** "Karnal Haryana", "Pinjore, Panchkula" … → district guesses and a state. */
export function parsePlace(place: string, knownState?: string) {
  let rest = ` ${place.replace(/[,.|/]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
  let state = knownState || '';
  for (const s of [...STATES].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\s${s.replace(/ /g, '\\s+')}\\s`, 'i');
    if (re.test(rest)) {
      state ||= s;
      rest = rest.replace(re, ' ');
    }
  }
  const words = rest.trim().split(' ').filter((w) => w.length >= 3);
  const lastTwo = words.length >= 2 ? [words.slice(-2).join(' ')] : [];
  const districts = [...new Set([words.join(' '), ...lastTwo, ...[...words].reverse()].filter(Boolean))];
  return { districts: districts.map(title), state: state ? title(state) : '' };
}

type Geo = { lat: number; lon: number; state: string; district: string; name: string };

/** Free geocoder (Open-Meteo, India only). Results are kept on the phone. */
async function geocode(name: string, stateHint?: string): Promise<Geo | null> {
  const key = `geo:${squash(name)}:${squash(stateHint || '')}`;
  try {
    const hit = localStorage.getItem(key);
    if (hit) return JSON.parse(hit);
  } catch {}
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name, count: '10', countryCode: 'IN', format: 'json' })}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const j = await res.json();
    const list: { latitude: number; longitude: number; admin1?: string; admin2?: string; name: string }[] = j.results || [];
    const pick = (stateHint && list.find((r) => r.admin1 && squash(agState(r.admin1)) === squash(agState(stateHint)))) || (stateHint ? null : list[0]);
    if (!pick) return null;
    const g: Geo = { lat: pick.latitude, lon: pick.longitude, state: agState(pick.admin1 || ''), district: (pick.admin2 || '').replace(/ District$/i, ''), name: pick.name };
    try {
      localStorage.setItem(key, JSON.stringify(g));
    } catch {}
    return g;
  } catch {
    return null;
  }
}

const km = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
};

async function query(apiKey: string, filters: Record<string, string>, limit = 300): Promise<MandiRow[]> {
  const url = new URL(RESOURCE);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));
  for (const [k, v] of Object.entries(filters)) url.searchParams.set(`filters[${k}]`, v);
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`data.gov.in ${res.status}`);
  const j = await res.json();
  return (j.records || [])
    .map((r: Record<string, unknown>) => ({
      state: String(r.state),
      district: String(r.district),
      market: String(r.market),
      variety: String(r.variety),
      date: String(r.arrival_date),
      min: Number(r.min_price),
      max: Number(r.max_price),
      modal: Number(r.modal_price),
    }))
    .filter((r: MandiRow) => r.modal > 0);
}

/** Runs tasks a few at a time (gentle on slow phone connections). */
async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

export const NEAR_KM = 200;

/**
 * Finds where the farmer is, then today's prices in their state and neighbouring states,
 * and sorts them by distance: mandis within 200 km first.
 */
export async function mandiPrices(
  apiKey: string,
  crop: string,
  place: string,
  profile?: { state?: string; district?: string; lat?: number; lon?: number }
): Promise<MandiResult> {
  const names = COMMODITY[crop];
  if (!names) return { level: 'none', rows: [] };
  const parsed = parsePlace(place, profile?.state);

  // 1. Where is the farmer?
  let origin: Geo | null = null;
  const samePlaceAsProfile = profile?.district && squash(place).includes(squash(profile.district.split(',')[0]));
  if (samePlaceAsProfile && profile?.lat && profile?.lon) {
    origin = { lat: profile.lat, lon: profile.lon, state: agState(profile.state || parsed.state), district: '', name: place };
  }
  for (const d of parsed.districts) {
    if (origin) break;
    origin = (await geocode(d, parsed.state || undefined)) || (parsed.state ? null : await geocode(d));
  }

  if (origin?.state) {
    // 2. Today's prices in the farmer's state and its neighbours.
    const states = [origin.state, ...(NEIGHBOURS[origin.state] || [])];
    const rows = (
      await pool(
        states.flatMap((st) => names.map((commodity) => ({ st, commodity }))),
        4,
        ({ st, commodity }) => query(apiKey, { commodity, 'state.keyword': st }).catch(() => [] as MandiRow[])
      )
    ).flat();

    if (rows.length) {
      // 3. Distance to each mandi's district.
      const pairs = [...new Map(rows.map((r) => [`${r.district}|${r.state}`, r])).values()].slice(0, 80);
      const geos = await pool(pairs, 6, (r) => geocode(r.district, r.state));
      const where = new Map(pairs.map((r, i) => [`${r.district}|${r.state}`, geos[i]]));
      for (const r of rows) {
        const g = where.get(`${r.district}|${r.state}`);
        if (g) r.km = km(origin, g);
        else if (squash(r.district) === squash(origin.district)) r.km = 0;
      }
      const located = rows.filter((r) => r.km !== undefined).sort((a, b) => a.km! - b.km! || a.modal - b.modal);
      const near = located.filter((r) => r.km! <= NEAR_KM);
      if (near.length) return { level: 'near', rows: near.slice(0, 15), place: origin.name };
      if (located.length) return { level: 'far', rows: located.slice(0, 10), place: origin.name };
    }
  }

  // 4. Fallback: by name (district → state → India).
  const steps: [MandiResult['level'], Record<string, string>][] = [
    ...parsed.districts.slice(0, 2).map((district) => ['district', { district }] as [MandiResult['level'], Record<string, string>]),
    ...(parsed.state ? [['state', { 'state.keyword': agState(parsed.state) }] as [MandiResult['level'], Record<string, string>]] : []),
    ['india', {}],
  ];
  for (const [level, f] of steps) {
    const rows = (await Promise.all(names.map((commodity) => query(apiKey, { commodity, ...f }, 50)))).flat();
    if (rows.length) {
      rows.sort((a, b) => a.modal - b.modal);
      return { level, rows: rows.slice(0, 12) };
    }
  }
  return { level: 'none', rows: [] };
}
