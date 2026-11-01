'use client';

/** Short weather summary for AI advice: rain in the last 30 days and the next 7 days. */
export async function weatherContext(lat?: number, lon?: number): Promise<string> {
  if (!lat || !lon) return '';
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&past_days=30&forecast_days=7&timezone=auto`
    );
    const j = await r.json();
    const rain: number[] = j.daily?.precipitation_sum || [];
    const tmax: number[] = j.daily?.temperature_2m_max || [];
    const tmin: number[] = j.daily?.temperature_2m_min || [];
    const past = rain.slice(0, 30).reduce((a, b) => a + (b || 0), 0);
    const next = rain.slice(30).reduce((a, b) => a + (b || 0), 0);
    const hi = Math.max(...tmax.slice(30));
    const lo = Math.min(...tmin.slice(30));
    return `Rain last 30 days: ${Math.round(past)} mm. Next 7 days: ${Math.round(next)} mm rain expected, temperature ${Math.round(lo)} to ${Math.round(hi)} °C.`;
  } catch {
    return '';
  }
}
