"use server";

import { requireAiUser, AuthError } from '@/lib/server-auth';
import {
  getIrrigationSuggestion as performIrrigationSuggestion,
  type IrrigationSuggestionInput,
  type IrrigationSuggestionOutput,
} from '@/ai/flows/irrigation-suggestion-flow';

export async function getIrrigationSuggestion(
  idToken: string,
  input: IrrigationSuggestionInput
): Promise<IrrigationSuggestionOutput> {
  try {
    await requireAiUser(idToken);
    const output = await performIrrigationSuggestion(input);
    return output;
  } catch (error) {
    if (error instanceof AuthError) throw new Error(error.message);
    console.error('Error getting irrigation suggestion:', error);
    throw new Error('Failed to get irrigation suggestion from AI.');
  }
}
