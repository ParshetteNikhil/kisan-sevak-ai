'use server';

import { requireAiUser, AuthError } from '@/lib/server-auth';
import { readSoilCard as performRead, type SoilCardInput, type SoilCardOutput } from '@/ai/flows/soil-card-flow';

export async function readSoilCard(idToken: string, input: SoilCardInput, locale?: string): Promise<SoilCardOutput> {
  try {
    await requireAiUser(idToken);
    return await performRead({ ...input, locale });
  } catch (error) {
    if (error instanceof AuthError) throw new Error(error.message);
    console.error('Error reading soil card:', error);
    throw new Error('Could not read the soil card.');
  }
}
