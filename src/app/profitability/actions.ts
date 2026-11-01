"use server";

import { withAiRetry } from '@/lib/ai-retry';
import { requireAiUser, AuthError } from '@/lib/server-auth';
import {
  forecastProfitability,
  type ProfitabilityForecastInput,
  type ProfitabilityForecastOutput,
} from '@/ai/flows/profitability-forecast-flow';

export async function getProfitabilityForecast(
  idToken: string,
  input: ProfitabilityForecastInput,
  locale?: string
): Promise<ProfitabilityForecastOutput> {
  try {
    await requireAiUser(idToken);
    const output = await withAiRetry(() => forecastProfitability({ ...input, locale }));
    return output;
  } catch (error) {
    if (error instanceof AuthError) throw new Error(error.message);
    console.error('Error getting profitability forecast:', error);
    throw new Error('Failed to get profitability forecast from AI.');
  }
}
