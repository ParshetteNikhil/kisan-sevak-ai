"use server";

import { requireAiUser, AuthError } from '@/lib/server-auth';
import {
  diagnoseCrop as performCropDiagnosis,
  type DiagnoseCropInput,
  type DiagnoseCropOutput,
} from '@/ai/flows/diagnose-crop-flow';

export async function diagnoseCrop(
  idToken: string,
  input: DiagnoseCropInput,
  locale?: string
): Promise<DiagnoseCropOutput> {
  try {
    await requireAiUser(idToken);
    const output = await performCropDiagnosis({ ...input, locale });
    return output;
  } catch (error) {
    if (error instanceof AuthError) throw new Error(error.message);
    console.error('Error getting crop diagnosis:', error);
    throw new Error('Failed to get crop diagnosis from AI.');
  }
}
