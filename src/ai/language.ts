import { z } from 'genkit';

/** Optional language code added to every AI flow's input. */
export const localeField = z
  .string()
  .optional()
  .describe('Language for the answer as an ISO 639-1 code: en, hi, bn, ta, te, mr, pa, gu, kn.');

/**
 * Prepended to every flow prompt (Handlebars). Makes answers readable for
 * farmers with little schooling, in their own language.
 */
export const FARMER_LANGUAGE_RULE = `LANGUAGE AND STYLE RULES (follow strictly):
- Write every free-text field of your answer in the language for code "{{#if locale}}{{locale}}{{else}}en{{/if}}" (en English, hi Hindi, bn Bengali, ta Tamil, te Telugu, mr Marathi, pa Punjabi, gu Gujarati, kn Kannada), using that language's own script.
- Keep fixed option values (enum values, units such as kg, quintal, acre, and field names) exactly as specified in the schema; translate only the free text.
- Use short, simple sentences a farmer with little schooling can understand when read aloud. No scientific jargon; if a scientific or chemical name is needed, give the common local name first.
- Prefer Indian units and money: quintal, acre, bigha, rupees (₹).
- When suggesting any pesticide or chemical, always add a short safety line (gloves, mask, keep away from children and water).

`;
