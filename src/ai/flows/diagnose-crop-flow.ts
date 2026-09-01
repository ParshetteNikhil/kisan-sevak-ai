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

const DiagnoseCropInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the affected plant part, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  problemDescription: z.string().describe('A description of the problem observed by the farmer.'),
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
  prompt: `You are an expert plant pathologist and agronomist. A farmer needs your help diagnosing a problem with their crop.

Analyze the provided image and the farmer's description of the problem.

1.  Identify the plant from the image.
2.  Determine if the plant is healthy.
3.  If the plant is not healthy, identify potential diseases or pests. For each possibility, provide its name, the probability (High, Medium, or Low) of it being the issue, a description, and a recommended treatment.
4.  Provide some general advice for improving the plant's health.

Return your full analysis in the specified JSON format.

Farmer's Description: {{{problemDescription}}}
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
