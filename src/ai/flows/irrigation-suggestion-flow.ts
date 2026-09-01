'use server';
/**
 * @fileOverview An AI agent for providing smart irrigation suggestions.
 *
 * - getIrrigationSuggestion - A function that provides irrigation advice.
 * - IrrigationSuggestionInput - The input type for the getIrrigationSuggestion function.
 * - IrrigationSuggestionOutput - The return type for the getIrrigationSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IrrigationSuggestionInputSchema = z.object({
  cropType: z.string().describe('The type of crop being grown.'),
  soilType: z.enum(['Loam', 'Clay', 'Sandy', 'Silt']).describe('The type of soil in the field.'),
  weatherForecast: z
    .string()
    .describe('A detailed local weather forecast, including temperature, humidity, wind speed, and chance of precipitation for the next few days.'),
  irrigationMethod: z.enum(['Drip', 'Sprinkler', 'Furrow']).describe('The method of irrigation used.'),
});
export type IrrigationSuggestionInput = z.infer<typeof IrrigationSuggestionInputSchema>;

const IrrigationSuggestionOutputSchema = z.object({
  recommendation: z.string().describe('A specific recommendation, including when to irrigate and how much water to apply (e.g., in inches or gallons per acre).'),
  reasoning: z.string().describe('A detailed explanation for the recommendation, referencing crop needs, soil properties, and weather data.'),
  nextSuggestedCheck: z.string().describe('Advice on when to check again for the next irrigation cycle.'),
});
export type IrrigationSuggestionOutput = z.infer<typeof IrrigationSuggestionOutputSchema>;

export async function getIrrigationSuggestion(input: IrrigationSuggestionInput): Promise<IrrigationSuggestionOutput> {
  return irrigationSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'irrigationSuggestionPrompt',
  input: {schema: IrrigationSuggestionInputSchema},
  output: {schema: IrrigationSuggestionOutputSchema},
  prompt: `You are an expert agronomist and water management specialist. Your task is to provide a precise irrigation recommendation for a farmer.

Analyze the following information:
- Crop Type: {{{cropType}}}
- Soil Type: {{{soilType}}}
- Weather Forecast: {{{weatherForecast}}}
- Irrigation Method: {{{irrigationMethod}}}

Based on this data, you must:
1.  Calculate the crop's water needs, considering its growth stage (assume mid-growth for this simulation) and the provided weather (evapotranspiration).
2.  Factor in the soil type's water-holding capacity and the irrigation method's efficiency.
3.  Provide a clear, actionable **recommendation**. State whether to irrigate now or wait. If irrigating, specify the amount of water to apply (e.g., in inches) and the best time of day.
4.  Explain the **reasoning** behind your recommendation, linking it directly to the weather, soil, and crop type.
5.  Suggest when the farmer should check back for the next irrigation cycle (e.g., "Check again in 2 days").

Return your full analysis in the specified JSON format.
`,
});

const irrigationSuggestionFlow = ai.defineFlow(
  {
    name: 'irrigationSuggestionFlow',
    inputSchema: IrrigationSuggestionInputSchema,
    outputSchema: IrrigationSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
