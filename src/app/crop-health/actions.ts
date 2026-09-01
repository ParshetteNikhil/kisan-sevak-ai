"use server";

import {
  diagnoseCrop as performCropDiagnosis,
  type DiagnoseCropInput,
  type DiagnoseCropOutput,
} from '@/ai/flows/diagnose-crop-flow';

export async function diagnoseCrop(
  input: DiagnoseCropInput
): Promise<DiagnoseCropOutput> {
  try {
    const output = await performCropDiagnosis(input);
    return output;
  } catch (error) {
    console.error('Error getting crop diagnosis:', error);
    throw new Error('Failed to get crop diagnosis from AI.');
  }
}
