"use server";

import { withAiRetry } from '@/lib/ai-retry';
import { requireAiUser, AuthError } from '@/lib/server-auth';
import {
  getInterStatePriceAnalysis,
  type InterStatePriceInput,
  type InterStatePriceOutput,
} from '@/ai/flows/inter-state-price-flow';

export async function analyzeInterStatePrice(
  idToken: string,
  input: InterStatePriceInput,
  locale?: string
): Promise<InterStatePriceOutput> {
  try {
    await requireAiUser(idToken);
    const output = await withAiRetry(() => getInterStatePriceAnalysis({ ...input, locale }));
    return output;
  } catch (error) {
    if (error instanceof AuthError) throw new Error(error.message);
    console.error('Error getting inter-state price analysis:', error);
    throw new Error('Failed to get analysis from AI.');
  }
}
