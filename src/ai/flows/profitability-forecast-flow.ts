'use server';
/**
 * @fileOverview An AI agent for forecasting crop profitability.
 *
 * - forecastProfitability - A function that handles the profitability analysis.
 * - ProfitabilityForecastInput - The input type for the forecastProfitability function.
 * - ProfitabilityForecastOutput - The return type for the forecastProfitability function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {localeField, FARMER_LANGUAGE_RULE} from '@/ai/language';

// Tool to get the current market price for a crop
// In a real application, this would fetch from a database or a live market data API.
const getMarketPrice = ai.defineTool(
  {
    name: 'getMarketPrice',
    description: 'Returns the current market price per quintal for a given crop.',
    inputSchema: z.object({
      cropName: z.string().describe('The name of the crop to get the price for.'),
    }),
    outputSchema: z.number().describe('The price per quintal in INR.'),
  },
  async ({ cropName }) => {
    // Simulated market prices.
    const prices: { [key: string]: number } = {
      'wheat': 2200,
      'rice': 3500,
      'basmati rice': 3650,
      'corn': 2000,
      'sugarcane': 350,
      'cotton': 7500,
      'potatoes': 1800,
      'soybeans': 4500,
    };
    const normalizedCropName = cropName.toLowerCase();
    return prices[normalizedCropName] || 2500; // Return a default price if not found
  }
);

const ProfitabilityForecastInputSchema = z.object({
  locale: localeField,
  cropName: z.string().describe('The name of the crop.'),
  fieldSize: z.number().describe('The size of the field.'),
  fieldUnit: z.enum(['acre', 'hectare']).describe('The unit for the field size.'),
  totalCosts: z.number().describe('The total estimated cost for cultivation (e.g., seeds, fertilizer, labor).'),
});
export type ProfitabilityForecastInput = z.infer<typeof ProfitabilityForecastInputSchema>;

const ProfitabilityForecastOutputSchema = z.object({
  estimatedYield: z.string().describe('The estimated total yield in quintals.'),
  marketPrice: z.string().describe('The current market price per quintal used for calculation.'),
  estimatedRevenue: z.string().describe('The total estimated revenue.'),
  netProfit: z.string().describe('The estimated net profit.'),
  breakEvenPrice: z.string().describe('The break-even price per quintal needed to cover costs.'),
  analysis: z.string().describe('A brief analysis and advice on the profitability.'),
});
export type ProfitabilityForecastOutput = z.infer<typeof ProfitabilityForecastOutputSchema>;

export async function forecastProfitability(input: ProfitabilityForecastInput): Promise<ProfitabilityForecastOutput> {
  return profitabilityForecastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'profitabilityForecastPrompt',
  input: {schema: ProfitabilityForecastInputSchema},
  output: {schema: ProfitabilityForecastOutputSchema},
  tools: [getMarketPrice],
  prompt: FARMER_LANGUAGE_RULE + `You are an expert agricultural financial analyst. A farmer wants a profitability forecast.

  Here is the farmer's data:
  - Crop: {{{cropName}}}
  - Field Size: {{{fieldSize}}} {{{fieldUnit}}}
  - Total Estimated Costs: ₹{{{totalCosts}}}

  Your tasks are:
  1.  First, use the getMarketPrice tool to find the current market price per quintal for the specified crop.
  2.  Based on standard agricultural data, estimate the potential yield in quintals for the given crop and field size. (Assume 1 hectare = 2.47 acres).
  3.  Calculate the estimated total revenue based on the estimated yield and the market price you fetched.
  4.  Calculate the net profit (Revenue - Costs).
  5.  Calculate the break-even price per quintal (Total Costs / Estimated Yield).
  6.  Provide a short, clear analysis. Comment on the potential profitability and any risks (like price volatility).

  Return all figures as formatted strings (e.g., "150 quintals", "₹3,37,500", "₹1,87,500").
  `,
});

const profitabilityForecastFlow = ai.defineFlow(
  {
    name: 'profitabilityForecastFlow',
    inputSchema: ProfitabilityForecastInputSchema,
    outputSchema: ProfitabilityForecastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
