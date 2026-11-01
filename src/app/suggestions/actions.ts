"use server";

import { requireAiUser, AuthError } from '@/lib/server-auth';
import {
  getWeatherBasedSuggestions,
  type WeatherBasedSuggestionsInput,
  type WeatherBasedSuggestionsOutput,
} from '@/ai/flows/weather-based-suggestions';

export async function getSuggestions(
  idToken: string,
  input: WeatherBasedSuggestionsInput,
  locale?: string
): Promise<WeatherBasedSuggestionsOutput> {
  try {
    await requireAiUser(idToken);
    const output = await getWeatherBasedSuggestions({ ...input, locale });
    return output;
  } catch (error) {
    if (error instanceof AuthError) throw new Error(error.message);
    console.error('Error getting suggestions:', error);
    // In a real app, you'd want more robust error handling
    throw new Error('Failed to get suggestions from AI.');
  }
}
