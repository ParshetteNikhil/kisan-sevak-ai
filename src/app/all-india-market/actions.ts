"use server";

import {
  getInterStatePriceAnalysis,
  type InterStatePriceInput,
  type InterStatePriceOutput,
} from '@/ai/flows/inter-state-price-flow';

export async function analyzeInterStatePrice(
  input: InterStatePriceInput
): Promise<InterStatePriceOutput> {
  try {
    const output = await getInterStatePriceAnalysis(input);
    return output;
  } catch (error) {
    console.error('Error getting inter-state price analysis:', error);
    throw new Error('Failed to get analysis from AI.');
  }
}
