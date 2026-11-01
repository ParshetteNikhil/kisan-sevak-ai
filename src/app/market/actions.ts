'use server';

import { withAiRetry } from '@/lib/ai-retry';
import { requireAiUser, AuthError } from '@/lib/server-auth';
import { parseListing as performParse, type ParseListingInput, type ParseListingOutput } from '@/ai/flows/parse-listing-flow';

export async function parseListing(idToken: string, input: ParseListingInput, locale?: string): Promise<ParseListingOutput> {
  try {
    await requireAiUser(idToken);
    return await withAiRetry(() => performParse({ ...input, locale }));
  } catch (error) {
    if (error instanceof AuthError) throw new Error(error.message);
    console.error('Error parsing listing:', error);
    throw new Error('Could not understand. Please try again.');
  }
}
