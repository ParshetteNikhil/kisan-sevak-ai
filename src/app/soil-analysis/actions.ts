"use server";

import { requireAiUser, AuthError } from '@/lib/server-auth';
import {
  getSoilAnalysis as performSoilAnalysis,
  type SoilAnalysisInput,
  type SoilAnalysisOutput,
} from '@/ai/flows/soil-analysis-flow';

export async function getSoilAnalysis(
  idToken: string,
  input: SoilAnalysisInput,
  locale?: string
): Promise<SoilAnalysisOutput> {
  try {
    await requireAiUser(idToken);
    const output = await performSoilAnalysis({ ...input, locale });
    return output;
  } catch (error) {
    if (error instanceof AuthError) throw new Error(error.message);
    console.error('Error getting soil analysis:', error);
    throw new Error('Failed to get soil analysis from AI.');
  }
}
