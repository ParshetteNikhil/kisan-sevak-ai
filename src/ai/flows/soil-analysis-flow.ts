'use server';
/**
 * @fileOverview An AI agent for analyzing soil type from an image and location, and suggesting suitable crops.
 *
 * - getSoilAnalysis - A function that handles the soil analysis process.
 * - SoilAnalysisInput - The input type for the getSoilAnalysis function.
 * - SoilAnalysisOutput - The return type for the getSoilAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SoilAnalysisInputSchema = z.object({
  soilPhotoDataUri: z
    .string()
    .describe(
      "A photo of soil, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  location: z.string().describe('The geographical location (e.g., "City, State") where the soil sample was taken.'),
});
export type SoilAnalysisInput = z.infer<typeof SoilAnalysisInputSchema>;

const SoilAnalysisOutputSchema = z.object({
  soilType: z.string().describe('The identified type of soil (e.g., Clay, Sandy, Loam, Silt).'),
  description: z.string().describe('A brief description of the soil characteristics, potentially including pH and nutrient levels if inferrable.'),
  suggestedCrops: z.array(z.string()).describe('A list of crops that are highly suitable for this soil type and location.'),
  soilAmendments: z.string().describe('Recommendations for soil amendments (e.g., adding compost, lime, or specific nutrients) to improve fertility and yield.'),
});
export type SoilAnalysisOutput = z.infer<typeof SoilAnalysisOutputSchema>;

export async function getSoilAnalysis(input: SoilAnalysisInput): Promise<SoilAnalysisOutput> {
  return soilAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'soilAnalysisPrompt',
  input: {schema: SoilAnalysisInputSchema},
  output: {schema: SoilAnalysisOutputSchema},
  prompt: `You are an expert agronomist and soil scientist with a goal to maximize farmer yield.

First, you MUST determine if the provided image is a photograph of soil.
- If the image IS NOT of soil, you must return a specific JSON object:
  {
    "soilType": "Invalid Image",
    "description": "The uploaded image does not appear to be of soil. Please upload a clear picture of a soil sample for analysis.",
    "suggestedCrops": [],
    "soilAmendments": "N/A"
  }
- If the image IS of soil, proceed with the full analysis as follows:

1.  From the image, identify the soil type based on visual characteristics like color, texture, and structure.
2.  Use the location information ('{{{location}}}') to refine your analysis. Consider regional soil databases (like the Harmonized World Soil Database), climate, and common soil characteristics for that area.
3.  Provide a detailed description of the soil's typical properties (e.g., water retention, drainage, likely pH range, and potential nutrient deficiencies or strengths for that region).
4.  Based on the combined analysis of the photo and location, recommend a list of at least 3-5 crops that are highly suitable and profitable for this specific soil type and local climate.
5.  Crucially, provide a list of recommended **soil amendments** to improve the soil's health and fertility for better yield. For example: "Add compost to improve organic matter" or "Apply lime to raise pH".

Location: {{{location}}}
Photo of soil: {{media url=soilPhotoDataUri}}`,
});

const soilAnalysisFlow = ai.defineFlow(
  {
    name: 'soilAnalysisFlow',
    inputSchema: SoilAnalysisInputSchema,
    outputSchema: SoilAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
