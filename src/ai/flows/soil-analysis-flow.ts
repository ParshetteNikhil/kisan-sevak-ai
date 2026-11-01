'use server';
/**
 * Hybrid soil advisor: combines a soil photo, the farmer's government Soil
 * Health Card values, farm details (location, land, crop, season, water) and
 * recent/forecast weather to give a yield-focused plan.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {localeField, FARMER_LANGUAGE_RULE} from '@/ai/language';

const SoilAnalysisInputSchema = z.object({
  locale: localeField,
  soilPhotoDataUri: z.string().optional().describe("Optional photo of the soil as a data URI: 'data:<mimetype>;base64,<data>'."),
  location: z.string().describe('Village/district and state of the field.'),
  farmContext: z.string().optional().describe('Farm details and Soil Health Card values given by the farmer.'),
  weatherContext: z.string().optional().describe('Rain in the last 30 days and the 7-day forecast for the field.'),
});
export type SoilAnalysisInput = z.infer<typeof SoilAnalysisInputSchema>;

const SoilAnalysisOutputSchema = z.object({
  isSoilPhoto: z.boolean().describe('False if a photo was given but it does not show soil. True if it shows soil or no photo was given.'),
  soilHealth: z.enum(['good', 'average', 'poor']).describe('Overall soil fertility judgement.'),
  soilType: z.string().describe('Most likely soil type, in plain words.'),
  soilStatus: z.string().describe('2-3 short sentences: what is good and what is lacking in this soil.'),
  fertilizerPlan: z
    .array(
      z.object({
        name: z.string().describe('Common product name sold in India, e.g. Urea, DAP, MOP, SSP, Zinc sulphate, Gypsum.'),
        amountPerAcre: z.string().describe('Amount for ONE ACRE in kg, and in 45 or 50 kg bags where useful, e.g. "50 kg (1 bag)".'),
        when: z.string().describe('When to apply, e.g. "at sowing", "30 days after sowing".'),
      })
    )
    .describe('Fertilizer plan for the main crop, for one acre, balanced using the Soil Health Card values when available.'),
  organicOptions: z.array(z.string()).describe('2-4 natural options: farmyard manure, vermicompost, green manure, biofertilizers.'),
  bestCrops: z.array(z.string()).describe('3-5 crops that suit this soil, place and season, best first.'),
  waterAdvice: z.string().describe('One or two sentences on irrigation, using the weather context.'),
  yieldTips: z.array(z.string()).describe('3-5 short, practical steps to get more yield this season.'),
  basis: z.array(z.string()).describe('What information the advice used, e.g. "Soil photo", "Soil Health Card", "Farm details", "Weather".'),
});
export type SoilAnalysisOutput = z.infer<typeof SoilAnalysisOutputSchema>;

const prompt = ai.definePrompt({
  name: 'soilAnalysisPrompt',
  input: {schema: SoilAnalysisInputSchema},
  output: {schema: SoilAnalysisOutputSchema},
  prompt: FARMER_LANGUAGE_RULE + `You are an Indian soil scientist and agronomist (ICAR/KVK style). Goal: the highest profitable yield for this farmer, with safe, affordable inputs.

Use ALL available information, in this order of trust:
1. Government Soil Health Card values in the farm details (most reliable for nutrients and pH). Use the standard Indian ratings (e.g. available N low < 280 kg/ha, P low < 10 kg/ha (Olsen), K low < 108 kg/ha; pH < 6.5 acidic, > 7.5 alkaline; OC low < 0.5%) to adjust doses from the recommended NPK for the crop.
2. "Government Soil Health Card data" for the district in the farm details: the share of tested fields that are low/medium/high in each nutrient. When the farmer has no card, use it as the starting point: e.g. if most fields are low in N, plan for low N; flag micronutrients that are often deficient (Zn, B, S, Fe…).
3. The farm details: location, main crop, season, land, water source.
4. The soil photo (colour, texture, cracks, salt crust, moisture), if given.
5. Typical soils and climate of the district and the weather context.
In "basis", name each source used, e.g. "Your Soil Health Card", "Government district soil data", "Soil photo", "Farm details", "Weather".

If a photo is given and it is NOT soil, set isSoilPhoto=false and still advise from the other information.
If there is no Soil Health Card, say in one short sentence that the advice uses district averages, and suggest a free soil test at the nearest soil testing lab or KVK for exact doses.
Give fertilizer amounts per ONE ACRE. Never recommend banned or highly hazardous pesticides.

Location: {{{location}}}
{{#if farmContext}}Farm details: {{{farmContext}}}{{/if}}
{{#if weatherContext}}Weather: {{{weatherContext}}}{{/if}}
{{#if soilPhotoDataUri}}Soil photo: {{media url=soilPhotoDataUri}}{{else}}No soil photo given.{{/if}}`,
});

const soilAnalysisFlow = ai.defineFlow(
  {name: 'soilAnalysisFlow', inputSchema: SoilAnalysisInputSchema, outputSchema: SoilAnalysisOutputSchema},
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function getSoilAnalysis(input: SoilAnalysisInput): Promise<SoilAnalysisOutput> {
  return soilAnalysisFlow(input);
}
