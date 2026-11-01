/**
 * District soil baseline from the Government of India Soil Health Card programme
 * (soilhealth.dac.gov.in nutrient dashboard). Counts of soil samples tested as
 * Low / Medium / High for each nutrient, summed over recent test cycles.
 * Server-only; results are cached for a day so the government site is called rarely.
 */
const ENDPOINT = 'https://soilhealth4.dac.gov.in';
const SCHEME = '660f941a5c8405ca8375c7c6'; // Soil Health Card scheme id used by the public dashboard
const DAY = 24 * 60 * 60 * 1000;

type Counts = Record<string, number>;
type DistrictCounts = Record<string, Counts>;
export type LMH = { low: number; medium: number; high: number };
export type SoilBaseline = {
  level: 'district' | 'state';
  state: string;
  district?: string;
  samples: number;
  cycles: string[];
  n?: LMH;
  p?: LMH;
  k?: LMH;
  oc?: LMH;
  ph?: { acidic: number; neutral: number; alkaline: number };
  salinePct?: number;
  deficientPct: Partial<Record<'S' | 'Zn' | 'Fe' | 'Cu' | 'Mn' | 'B', number>>;
};

async function gql<T>(operationName: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ operationName, variables, query }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`SHC ${res.status}`);
  const j = await res.json();
  if (j.errors) throw new Error('SHC query error');
  return j.data;
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '');

function cycles(): string[] {
  // Indian test cycles run April–March: e.g. Nov 2026 → 2026-27.
  const d = new Date();
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return [0, 1, 2, 3].map((i) => `${start - i}-${String((start - i + 1) % 100).padStart(2, '0')}`);
}

let statesCache: { at: number; list: { _id: string; name: string }[] } | null = null;
const stateCache = new Map<string, { at: number; districts: Map<string, { name: string; counts: DistrictCounts; cycles: Set<string> }> }>();

async function states() {
  if (statesCache && Date.now() - statesCache.at < DAY) return statesCache.list;
  const d = await gql<{ getState: { _id: string; name: string }[] }>(
    'GetState',
    'query GetState($getStateId: String, $code: String) {\n  getState(id: $getStateId, code: $code)\n}',
    {}
  );
  statesCache = { at: Date.now(), list: d.getState };
  return d.getState;
}

const DASH_Q =
  'query GetNutrientDashboardForPortal($state: ID, $district: ID, $block: ID, $village: ID, $cycle: String, $count: Boolean, $scheme: String) {\n  getNutrientDashboardForPortal(\n    state: $state\n    district: $district\n    block: $block\n    village: $village\n    cycle: $cycle\n    count: $count\n    scheme: $scheme\n  )\n}';

async function stateDistricts(stateId: string) {
  const hit = stateCache.get(stateId);
  if (hit && Date.now() - hit.at < DAY) return hit.districts;
  const districts = new Map<string, { name: string; counts: DistrictCounts; cycles: Set<string> }>();
  for (const cycle of cycles()) {
    let rows: { district?: { name?: string }; results?: DistrictCounts }[] = [];
    try {
      const d = await gql<{ getNutrientDashboardForPortal: typeof rows }>('GetNutrientDashboardForPortal', DASH_Q, { state: stateId, cycle, scheme: SCHEME });
      rows = d.getNutrientDashboardForPortal || [];
    } catch {
      continue;
    }
    for (const r of rows) {
      const name = r.district?.name;
      if (!name || !r.results) continue;
      const key = norm(name);
      const entry = districts.get(key) || { name, counts: {}, cycles: new Set<string>() };
      entry.cycles.add(cycle);
      for (const [nut, obj] of Object.entries(r.results)) {
        const c = (entry.counts[nut] ||= {});
        for (const [k, v] of Object.entries(obj || {})) c[k] = (c[k] || 0) + (Number(v) || 0);
      }
      districts.set(key, entry);
    }
  }
  stateCache.set(stateId, { at: Date.now(), districts });
  return districts;
}

function lmh(c?: Counts): LMH | undefined {
  const tot = c ? (c.Low || 0) + (c.Medium || 0) + (c.High || 0) : 0;
  if (!c || !tot) return undefined;
  return { low: Math.round((100 * (c.Low || 0)) / tot), medium: Math.round((100 * (c.Medium || 0)) / tot), high: Math.round((100 * (c.High || 0)) / tot) };
}

function summarise(counts: DistrictCounts) {
  const pH = counts.pH || {};
  const samples = (pH.Acidic || 0) + (pH.Neutral || 0) + (pH.Alkaline || 0);
  const ec = counts.EC || {};
  const ecTot = (ec.Saline || 0) + (ec.NonSaline || 0);
  const deficientPct: SoilBaseline['deficientPct'] = {};
  for (const m of ['S', 'Zn', 'Fe', 'Cu', 'Mn', 'B'] as const) {
    const c = counts[m];
    const tot = c ? (c.Sufficient || 0) + (c.Deficient || 0) : 0;
    if (tot) deficientPct[m] = Math.round((100 * (c.Deficient || 0)) / tot);
  }
  return {
    samples,
    n: lmh(counts.n),
    p: lmh(counts.p),
    k: lmh(counts.k),
    oc: lmh(counts.OC),
    ph: samples
      ? { acidic: Math.round((100 * (pH.Acidic || 0)) / samples), neutral: Math.round((100 * (pH.Neutral || 0)) / samples), alkaline: Math.round((100 * (pH.Alkaline || 0)) / samples) }
      : undefined,
    salinePct: ecTot ? Math.round((100 * (ec.Saline || 0)) / ecTot) : undefined,
    deficientPct,
  };
}

/** Finds the state, then the district among the place names given (e.g. ["Pinjore", "Panchkula"]). */
export async function soilBaseline(stateName: string, placeNames: string[]): Promise<SoilBaseline | null> {
  const list = await states();
  const sn = norm(stateName);
  const st = list.find((s) => norm(s.name) === sn) || list.find((s) => sn && (norm(s.name).startsWith(sn) || sn.startsWith(norm(s.name))));
  if (!st) return null;
  const districts = await stateDistricts(st._id);
  if (!districts.size) return null;

  for (const place of placeNames.map(norm).filter((p) => p.length >= 3)) {
    const match =
      districts.get(place) ||
      [...districts.entries()].find(([k]) => k.startsWith(place) || place.startsWith(k))?.[1];
    if (match) {
      return { level: 'district', state: st.name, district: match.name, cycles: [...match.cycles].sort().reverse(), ...summarise(match.counts) };
    }
  }

  // No district match: use the whole state.
  const total: DistrictCounts = {};
  const allCycles = new Set<string>();
  for (const d of districts.values()) {
    d.cycles.forEach((c) => allCycles.add(c));
    for (const [nut, obj] of Object.entries(d.counts)) {
      const c = (total[nut] ||= {});
      for (const [k, v] of Object.entries(obj)) c[k] = (c[k] || 0) + v;
    }
  }
  return { level: 'state', state: st.name, cycles: [...allCycles].sort().reverse(), ...summarise(total) };
}
