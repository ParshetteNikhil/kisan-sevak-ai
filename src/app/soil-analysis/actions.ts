"use server";

import {
  getSoilAnalysis as performSoilAnalysis,
  type SoilAnalysisInput,
  type SoilAnalysisOutput,
} from '@/ai/flows/soil-analysis-flow';

export async function getSoilAnalysis(
  input: SoilAnalysisInput
): Promise<SoilAnalysisOutput> {
  try {
    const output = await performSoilAnalysis(input);
    return output;
  } catch (error) {
    console.error('Error getting soil analysis:', error);
    throw new Error('Failed to get soil analysis from AI.');
  }
}
