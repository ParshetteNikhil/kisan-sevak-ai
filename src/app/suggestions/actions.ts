"use server";

import {
  getWeatherBasedSuggestions,
  type WeatherBasedSuggestionsInput,
  type WeatherBasedSuggestionsOutput,
} from '@/ai/flows/weather-based-suggestions';

export async function getSuggestions(
  input: WeatherBasedSuggestionsInput
): Promise<WeatherBasedSuggestionsOutput> {
  try {
    const output = await getWeatherBasedSuggestions(input);
    return output;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    // In a real app, you'd want more robust error handling
    throw new Error('Failed to get suggestions from AI.');
  }
}
