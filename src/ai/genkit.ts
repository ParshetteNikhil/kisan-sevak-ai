import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Free-tier friendly: most flows use the light model (more free requests per day).
// Photo-heavy tasks (crop disease, reading the soil card) use the stronger model.
// Override with GENKIT_MODEL / GENKIT_STRONG_MODEL.
const model = process.env.GENKIT_MODEL || 'gemini-3.1-flash-lite';
export const strongModel = `googleai/${process.env.GENKIT_STRONG_MODEL || 'gemini-3.8-flash'}`;

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY })],
  model: `googleai/${model}`,
});
