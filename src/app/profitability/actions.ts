"use server";

import {
  forecastProfitability,
  type ProfitabilityForecastInput,
  type ProfitabilityForecastOutput,
} from '@/ai/flows/profitability-forecast-flow';

export async function getProfitabilityForecast(
  input: ProfitabilityForecastInput
): Promise<ProfitabilityForecastOutput> {
  try {
    const output = await forecastProfitability(input);
    return output;
  } catch (error) {
    console.error('Error getting profitability forecast:', error);
    throw new Error('Failed to get profitability forecast from AI.');
  }
}
