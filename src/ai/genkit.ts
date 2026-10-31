import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// gemini-2.0-flash passed its earliest shutdown date (June 2026), so the
// structured AI flows default to gemini-3.8-flash. Override with GENKIT_MODEL.
const model = process.env.GENKIT_MODEL || 'gemini-3.8-flash';

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY })],
  model: `googleai/${model}`,
});
