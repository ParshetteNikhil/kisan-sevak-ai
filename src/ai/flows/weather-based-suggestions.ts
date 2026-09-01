'use server';

/**
 * @fileOverview AI-driven suggestions about the best times to schedule farming activities based on local weather forecasts.
 *
 * - getWeatherBasedSuggestions - A function that provides suggestions based on weather forecasts.
 * - WeatherBasedSuggestionsInput - The input type for the getWeatherBasedSuggestions function.
 * - WeatherBasedSuggestionsOutput - The return type for the getWeatherBasedSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeatherBasedSuggestionsInputSchema = z.object({
  weatherForecast: z
    .string()
    .describe('The local weather forecast, including temperature, precipitation, and humidity.'),
  cropType: z.string().describe('The type of crop being grown.'),
  farmingActivity: z
    .string()
    .describe(
      'The specific farming activity to schedule, such as planting, fertilizing, or harvesting.'
    ),
});
export type WeatherBasedSuggestionsInput = z.infer<
  typeof WeatherBasedSuggestionsInputSchema
>;

const WeatherBasedSuggestionsOutputSchema = z.object({
  suggestion: z
    .string()
    .describe(
      'An AI-driven suggestion about the optimal time to schedule the farming activity, based on the weather forecast and crop type.'
    ),
  reasoning: z
    .string()
    .describe(
      'The AI reasoning behind the suggestion, explaining how the weather forecast and crop type influence the optimal timing.'
    ),
});
export type WeatherBasedSuggestionsOutput = z.infer<
  typeof WeatherBasedSuggestionsOutputSchema
>;

export async function getWeatherBasedSuggestions(
  input: WeatherBasedSuggestionsInput
): Promise<WeatherBasedSuggestionsOutput> {
  return weatherBasedSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weatherBasedSuggestionsPrompt',
  input: {schema: WeatherBasedSuggestionsInputSchema},
  output: {schema: WeatherBasedSuggestionsOutputSchema},
  prompt: `You are an expert agronomist AI. Your task is to provide a specific suggestion and the reasoning for the best time to perform a farming activity.

Analyze the provided weather forecast, crop type, and the intended farming activity.

Based on this information, provide:
1.  A clear, actionable **suggestion** for the optimal time to perform the activity.
2.  A concise **reasoning** explaining why this is the best time, referencing the provided weather and crop details.

Return your response in the specified JSON format.

Weather Forecast: {{{weatherForecast}}}
Crop Type: {{{cropType}}}
Farming Activity: {{{farmingActivity}}}`,
});

const weatherBasedSuggestionsFlow = ai.defineFlow(
  {
    name: 'weatherBasedSuggestionsFlow',
    inputSchema: WeatherBasedSuggestionsInputSchema,
    outputSchema: WeatherBasedSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
