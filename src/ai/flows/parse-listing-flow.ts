'use server';
/** Turns a spoken sentence like "10 quintal gehun 2400 rupaye Karnal" into a marketplace listing. */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {localeField} from '@/ai/language';

const ParseListingInputSchema = z.object({
  locale: localeField,
  text: z.string().describe('What the farmer said, in any Indian language or English.'),
});
export type ParseListingInput = z.infer<typeof ParseListingInputSchema>;

const ParseListingOutputSchema = z.object({
  crop: z.string().nullable().describe('Crop name in English, e.g. Wheat, Paddy, Onion. Null if not said.'),
  quantity: z.number().nullable().describe('Amount as a number. Null if not said.'),
  unit: z.enum(['kg', 'quintal', 'tonnes']).nullable().describe('Unit of the amount; "kwintal/क्विंटल" = quintal, "ton/टन" = tonnes. Null if not said.'),
  askingPrice: z.number().nullable().describe('Price in rupees PER UNIT. If the farmer gave a total price, divide by quantity. Null if not said.'),
  location: z.string().nullable().describe('Village/town/district if said, else null.'),
});
export type ParseListingOutput = z.infer<typeof ParseListingOutputSchema>;

const prompt = ai.definePrompt({
  name: 'parseListingPrompt',
  input: {schema: ParseListingInputSchema},
  output: {schema: ParseListingOutputSchema},
  prompt: `A farmer in India spoke this to list produce for sale. Extract the fields. Understand Hindi and regional words for crops, numbers and units (e.g. gehun = wheat, dhaan = paddy, pyaaz = onion, kapas = cotton, chana, tur/arhar, soyabean, makka = maize, sarson = mustard). Do not invent missing values.

Spoken text: {{{text}}}`,
});

const parseListingFlow = ai.defineFlow(
  {name: 'parseListingFlow', inputSchema: ParseListingInputSchema, outputSchema: ParseListingOutputSchema},
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function parseListing(input: ParseListingInput): Promise<ParseListingOutput> {
  return parseListingFlow(input);
}
