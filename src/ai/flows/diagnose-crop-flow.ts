'use server';
/**
 * @fileOverview A crop health diagnosis AI agent.
 *
 * - diagnoseCrop - A function that handles the crop diagnosis process.
 * - DiagnoseCropInput - The input type for the diagnoseCrop function.
 * - DiagnoseCropOutput - The return type for the diagnoseCrop function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {localeField, FARMER_LANGUAGE_RULE} from '@/ai/language';

const DiagnoseCropInputSchema = z.object({
  locale: localeField,
  photoDataUri: z
    .string()
    .describe(
      "A photo of the affected plant part, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  problemDescription: z.string().optional().describe('What the farmer observed, if they said anything.'),
  farmContext: z.string().optional().describe('Farm details: location, crop, season, soil.'),
});
export type DiagnoseCropInput = z.infer<typeof DiagnoseCropInputSchema>;

const DiagnoseCropOutputSchema = z.object({
  plantName: z.string().describe('The common name of the identified plant.'),
  isHealthy: z.boolean().describe('Whether the plant appears to be healthy.'),
  possibleDiseases: z.array(z.object({
      name: z.string().describe('The name of the potential disease or pest.'),
      probability: z.enum(['High', 'Medium', 'Low']).describe('The likelihood of this being the correct diagnosis.'),
      description: z.string().describe('A brief description of the disease or pest.'),
      recommendedTreatment: z.string().describe('A suggested course of action or treatment.'),
    })).describe("A list of possible diseases or pests affecting the plant."),
  generalAdvice: z.string().describe("General advice for improving the plant's health."),
});
export type DiagnoseCropOutput = z.infer<typeof DiagnoseCropOutputSchema>;

export async function diagnoseCrop(input: DiagnoseCropInput): Promise<DiagnoseCropOutput> {
  return diagnoseCropFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseCropPrompt',
  input: {schema: DiagnoseCropInputSchema},
  output: {schema: DiagnoseCropOutputSchema},
  prompt: FARMER_LANGUAGE_RULE + `You are an expert plant pathologist and agronomist. A farmer needs your help diagnosing a problem with their crop.

Analyze the provided image and the farmer's description of the problem.

1.  Identify the plant from the image.
2.  Determine if the plant is healthy.
3.  If the plant is not healthy, identify potential diseases or pests. For each possibility, provide its name, the probability (High, Medium, or Low) of it being the issue, a description, and a recommended treatment.
4.  Provide some general advice for improving the plant's health.

Return your full analysis in the specified JSON format.

Keep each description and treatment to 2-3 short sentences. Treatment must say what to buy, how much per litre of water or per acre, and when to spray, plus a cheaper organic option when one works.
If the photo does not show a plant, set plantName to "Not a plant" and give advice to take a clear, close photo of the affected leaf in daylight.

{{#if farmContext}}Farm details: {{{farmContext}}}{{/if}}
Farmer's Description: {{#if problemDescription}}{{{problemDescription}}}{{else}}(none){{/if}}
Photo of Plant: {{media url=photoDataUri}}`,
});

const diagnoseCropFlow = ai.defineFlow(
  {
    name: 'diagnoseCropFlow',
    inputSchema: DiagnoseCropInputSchema,
    outputSchema: DiagnoseCropOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
