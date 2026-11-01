'use client';

import { getIdTokenOrThrow } from '@/lib/firebase';

export type AskResult = { text: string; searchCitations: { title: string; uri: string }[] };

/** Calls the server AI chat route with the signed-in user's token. */
export async function askAI(body: {
  message: string;
  locale: string;
  role?: 'agronomist' | 'market_strategist' | 'bioscience_specialist' | 'soil_expert';
  grounding?: 'none' | 'search' | 'maps';
  farmContext?: string;
  history?: { role: 'user' | 'model'; text: string }[];
}): Promise<AskResult> {
  const idToken = await getIdTokenOrThrow();
  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ modelTier: 'general', history: [], ...body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'AI error');
  return { text: data.text || '', searchCitations: data.searchCitations || [] };
}
