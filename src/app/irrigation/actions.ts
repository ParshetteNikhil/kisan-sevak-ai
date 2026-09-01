"use server";

import {
  getIrrigationSuggestion as performIrrigationSuggestion,
  type IrrigationSuggestionInput,
  type IrrigationSuggestionOutput,
} from '@/ai/flows/irrigation-suggestion-flow';

export async function getIrrigationSuggestion(
  input: IrrigationSuggestionInput
): Promise<IrrigationSuggestionOutput> {
  try {
    const output = await performIrrigationSuggestion(input);
    return output;
  } catch (error) {
    console.error('Error getting irrigation suggestion:', error);
    throw new Error('Failed to get irrigation suggestion from AI.');
  }
}
