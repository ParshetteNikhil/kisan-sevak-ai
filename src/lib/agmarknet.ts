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

export type MandiRow = { state: string; district: string; market: string; variety: string; date: string; min: number; max: number; modal: number };
export type MandiResult = { level: 'district' | 'state' | 'india' | 'none'; rows: MandiRow[] };

const title = (s: string) => s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const squash = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

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

async function query(apiKey: string, filters: Record<string, string>): Promise<MandiRow[]> {
  const url = new URL(RESOURCE);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '50');
  for (const [k, v] of Object.entries(filters)) url.searchParams.set(`filters[${k}]`, v);
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
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

/** District first, then state, then all India. */
export async function mandiPrices(apiKey: string, crop: string, place: string, knownState?: string): Promise<MandiResult> {
  const names = COMMODITY[crop];
  if (!names) return { level: 'none', rows: [] };
  const { districts, state } = parsePlace(place, knownState);

  const steps: [MandiResult['level'], Record<string, string>][] = [
    ...districts.slice(0, 3).map((district) => ['district', { district }] as [MandiResult['level'], Record<string, string>]),
    ...(state ? [['state', { 'state.keyword': state }] as [MandiResult['level'], Record<string, string>]] : []),
    ['india', {}],
  ];
  for (const [level, f] of steps) {
    const rows = (await Promise.all(names.map((commodity) => query(apiKey, { commodity, ...f })))).flat();
    if (rows.length) {
      // A district name can exist in two states; keep the farmer's state when known.
      const inState = state && level === 'district' ? rows.filter((r) => squash(r.state) === squash(state)) : rows;
      const use = inState.length ? inState : rows;
      use.sort((a, b) => a.modal - b.modal);
      return { level, rows: use.slice(0, 12) };
    }
  }
  return { level: 'none', rows: [] };
}
