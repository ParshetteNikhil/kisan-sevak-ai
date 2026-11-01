'use client';

import { useEffect, useState } from 'react';
import type { FarmProfile } from '@/hooks/use-farm-profile';
import { farmContext } from '@/hooks/use-farm-profile';
import type { SoilBaseline, LMH } from '@/lib/soil-baseline';

/** Government district soil statistics for the farmer's location (null until known). */
export function useSoilBaseline(profile?: Pick<FarmProfile, 'state' | 'district'> | null) {
  const [baseline, setBaseline] = useState<SoilBaseline | null>(null);
  const state = profile?.state || '';
  const place = profile?.district || '';

  useEffect(() => {
    if (!state) {
      setBaseline(null);
      return;
    }
    let live = true;
    // Wait until typing stops before asking the server.
    const timer = setTimeout(() => {
      fetch(`/api/soil-baseline?${new URLSearchParams({ state, place })}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((b) => live && setBaseline(b))
        .catch(() => live && setBaseline(null));
    }, 700);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [state, place]);

  return baseline;
}

const word = (x?: LMH) => {
  if (!x) return '';
  const top = (Object.entries(x) as [keyof LMH, number][]).sort((a, b) => b[1] - a[1])[0];
  return `mostly ${top[0]} (${x.low}% low, ${x.medium}% medium, ${x.high}% high)`;
};

/** English summary of the government baseline for the AI. */
export function baselineText(b?: SoilBaseline | null) {
  if (!b) return '';
  const where = b.level === 'district' ? `${b.district} district, ${b.state}` : `${b.state} state (district not matched)`;
  const def = Object.entries(b.deficientPct)
    .filter(([, v]) => (v || 0) >= 20)
    .map(([k, v]) => `${k} ${v}%`)
    .join(', ');
  return [
    `Government Soil Health Card data for ${where}, ${b.samples} samples tested (${b.cycles.join(', ')}):`,
    b.n && `Nitrogen ${word(b.n)}.`,
    b.p && `Phosphorus ${word(b.p)}.`,
    b.k && `Potassium ${word(b.k)}.`,
    b.oc && `Organic carbon ${word(b.oc)}.`,
    b.ph && `pH: ${b.ph.acidic}% acidic, ${b.ph.neutral}% neutral, ${b.ph.alkaline}% alkaline.`,
    b.salinePct !== undefined && `Saline soils: ${b.salinePct}%.`,
    def && `Share of samples deficient: ${def}.`,
    "These are district averages, not this farmer's own field; the farmer's Soil Health Card values, if given, take priority.",
  ]
    .filter(Boolean)
    .join(' ');
}

/** Farm details + government baseline, as one context string for AI calls. */
export function useFarmContextText(profile?: FarmProfile | null) {
  const baseline = useSoilBaseline(profile);
  return [farmContext(profile), baselineText(baseline)].filter(Boolean).join(' ');
}
