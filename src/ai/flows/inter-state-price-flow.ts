'use server';
/**
 * @fileOverview An AI agent for calculating inter-state crop prices including transportation.
 *
 * - getInterStatePriceAnalysis - A function that handles the price analysis.
 * - InterStatePriceInput - The input type for the function.
 * - InterStatePriceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Tool to get market price based on crop and location
const getMarketPriceByLocation = ai.defineTool(
  {
    name: 'getMarketPriceByLocation',
    description: 'Returns the current market price per quintal for a given crop in a specific Indian location.',
    inputSchema: z.object({
      cropName: z.string().describe('The name of the crop.'),
      location: z.string().describe('The city and state, e.g., "Panchkula, Haryana".'),
    }),
    outputSchema: z.number().describe('The price per quintal in INR.'),
  },
  async ({ cropName, location }) => {
    // Simulated market prices with location variations.
    const basePrices: { [key: string]: number } = {
      'wheat': 2200, 'rice': 3500, 'basmati rice': 3650, 'corn': 2000,
      'sugarcane': 350, 'cotton': 7500, 'potatoes': 1800, 'soybeans': 4500,
    };
    const price = basePrices[cropName.toLowerCase()] || 2500;
    // Simulate location-based price variation
    const hash = location.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const variation = 1 + (hash % 20 - 10) / 100; // +/- 10%
    return Math.round(price * variation);
  }
);

// Tool to get distance between two locations
const getDistance = ai.defineTool(
  {
    name: 'getDistance',
    description: 'Calculates the approximate road distance between two locations in India.',
    inputSchema: z.object({
      origin: z.string().describe('The starting location, e.g., "Bhalki, Karnataka".'),
      destination: z.string().describe('The ending location, e.g., "Panchkula, Haryana".'),
    }),
    outputSchema: z.number().describe('The distance in kilometers.'),
  },
  async ({ origin, destination }) => {
    // This is a highly simplified simulation. A real app would use a mapping API.
    const combinedLength = (origin + destination).replace(/[^a-zA-Z]/g, '').length;
    // Reduce the multipliers to generate smaller, more believable distances for a simulation.
    const baseDistance = (combinedLength * 19) % 1500; 
    const randomFactor = Math.floor(Math.random() * 200) - 100;
    return Math.max(50, baseDistance + randomFactor); // Ensure a minimum distance of 50km
  }
);


const InterStatePriceInputSchema = z.object({
  cropName: z.string().describe('The name of the crop.'),
  quantity: z.number().describe('The quantity of the crop.'),
  unit: z.enum(['kg', 'quintal', 'tonnes']).describe('The unit for the quantity.'),
  origin: z.string().describe('The farmer\'s location, e.g., "Bhalki, Karnataka".'),
  destination: z.string().describe('The destination market location, e.g., "Panchkula, Haryana".'),
});
export type InterStatePriceInput = z.infer<typeof InterStatePriceInputSchema>;

const InterStatePriceOutputSchema = z.object({
  estimatedDistance: z.string().describe('The estimated distance between the locations, formatted as a string with "km".'),
  marketPriceAtDestination: z.string().describe('The market price per quintal at the destination, formatted as a string with currency.'),
  estimatedTransportationCost: z.string().describe('The total estimated cost for transportation, formatted as a string with currency.'),
  netPricePerQuintalAfterTransport: z.string().describe('The net price per quintal after deducting transportation costs, formatted as a string with currency.'),
  potentialNetRevenue: z.string().describe('The potential total net revenue for the farmer after transport costs, formatted as a string with currency.'),
  analysis: z.string().describe('A brief analysis of the opportunity, commenting on the price difference and viability.'),
});
export type InterStatePriceOutput = z.infer<typeof InterStatePriceOutputSchema>;


export async function getInterStatePriceAnalysis(input: InterStatePriceInput): Promise<InterStatePriceOutput> {
  return interStatePriceFlow(input);
}

const prompt = ai.definePrompt({
    name: 'interStatePricePrompt',
    input: {schema: InterStatePriceInputSchema},
    output: {schema: InterStatePriceOutputSchema},
    tools: [getMarketPriceByLocation, getDistance],
    prompt: `You are an agricultural logistics and pricing expert. A farmer wants to analyze the profitability of selling their produce in a different state.

    Farmer's Data:
    - Origin: {{{origin}}}
    - Destination: {{{destination}}}
    - Crop: {{{cropName}}}
    - Quantity: {{{quantity}}} {{{unit}}}

    Your tasks are:
    1.  Use the 'getDistance' tool to find the approximate road distance in kilometers.
    2.  Use the 'getMarketPriceByLocation' tool to get the current market price per quintal for the crop at the destination.
    3.  Calculate the total estimated transportation cost. Use the following more realistic model:
        - A base charge of ₹2,500.
        - A per-kilometer charge of ₹5 per tonne.
        - The formula is: \`Total Cost = 2500 + (Distance in km * Total Quantity in Tonnes * 5)\`.
        - It is **critical** you follow this formula precisely.
        - Convert the input quantity to tonnes for this calculation (1 quintal = 0.1 tonnes, 1 kg = 0.001 tonnes).
    4.  Calculate the net price per quintal after deducting transportation costs. To do this, first find the transportation cost per quintal (Total Transportation Cost / Total Quantity in Quintals). Then subtract this from the market price per quintal at the destination.
    5.  Calculate the potential total net revenue for the farmer (Net Price Per Quintal * Total Quantity in Quintals).
    6.  Provide a brief analysis of the opportunity, commenting on the price difference and whether it seems viable after transport costs.

    Return all values as properly formatted strings.
    - Monetary values must be formatted with the '₹' symbol and Indian comma style (e.g., "₹1,44,000").
    - Distance must be formatted with " km" (e.g., "1,820 km").
    - Per-quintal prices must include "/ quintal" (e.g., "₹3,512 / quintal").
  `,
});

const interStatePriceFlow = ai.defineFlow(
  {
    name: 'interStatePriceFlow',
    inputSchema: InterStatePriceInputSchema,
    outputSchema: InterStatePriceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
