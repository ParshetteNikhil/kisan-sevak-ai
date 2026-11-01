'use server';
/**
 * Reads a government Soil Health Card (India) from a photo and returns the
 * tested values, so farmers don't have to type numbers.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {localeField} from '@/ai/language';

const SoilCardInputSchema = z.object({
  locale: localeField,
  photoDataUri: z.string().describe("Photo of the Soil Health Card as a data URI: 'data:<mimetype>;base64,<data>'."),
});
export type SoilCardInput = z.infer<typeof SoilCardInputSchema>;

const num = (d: string) => z.number().nullable().optional().describe(d);

const SoilCardOutputSchema = z.object({
  isSoilCard: z.boolean().describe('True only if the photo shows a soil test report / Soil Health Card.'),
  n: num('Available Nitrogen in kg/ha'),
  p: num('Available Phosphorus in kg/ha'),
  k: num('Available Potassium in kg/ha'),
  s: num('Available Sulphur in ppm (mg/kg)'),
  zn: num('Zinc in ppm'),
  fe: num('Iron in ppm'),
  cu: num('Copper in ppm'),
  mn: num('Manganese in ppm'),
  b: num('Boron in ppm'),
  ph: num('Soil pH'),
  ec: num('Electrical conductivity in dS/m'),
  oc: num('Organic carbon in percent'),
  testDate: z.string().nullable().optional().describe('Date the sample was tested or the card issued, as YYYY-MM-DD if readable.'),
});
export type SoilCardOutput = z.infer<typeof SoilCardOutputSchema>;

const prompt = ai.definePrompt({
  name: 'soilCardPrompt',
  input: {schema: SoilCardInputSchema},
  output: {schema: SoilCardOutputSchema},
  prompt: `You read Indian government Soil Health Cards (and similar soil test reports).
Read ONLY values that are clearly printed in the "Test Value" / "Value" column of the card. Do not guess.
Convert to the units described in the output schema when the card uses other units; leave a value null if it is missing or unreadable.
If the photo is not a soil test card, return isSoilCard=false and all values null.

Photo: {{media url=photoDataUri}}`,
});

const soilCardFlow = ai.defineFlow(
  {name: 'soilCardFlow', inputSchema: SoilCardInputSchema, outputSchema: SoilCardOutputSchema},
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function readSoilCard(input: SoilCardInput): Promise<SoilCardOutput> {
  return soilCardFlow(input);
}
