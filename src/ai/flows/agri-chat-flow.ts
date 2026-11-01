'use server';
/**
 * @fileOverview An AI agent for answering farming-related questions.
 *
 * - getChatResponse - A function that handles the chat interaction.
 * - ChatMessage - The type for a chat message.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {FARMER_LANGUAGE_RULE} from '@/ai/language';

const AgriChatInputSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ),
  message: z.string().describe('The user\'s latest message.'),
  locale: z.string().describe('The language to respond in, specified as a two-letter ISO 639-1 code.'),
});
export type AgriChatInput = z.infer<typeof AgriChatInputSchema>;


export type ChatMessage = {
    role: 'user' | 'model';
    content: string;
}

export async function getChatResponse(history: ChatMessage[], message: string, locale: string): Promise<string> {
  const response = await agriChatFlow({ history, message, locale });
  return response;
}

const prompt = ai.definePrompt({
  name: 'agriChatPrompt',
  input: {schema: AgriChatInputSchema},
  prompt: FARMER_LANGUAGE_RULE + `You are 'Agri-Chat', an expert agronomist and farming assistant AI. Your role is to provide helpful, accurate, and concise answers to questions related to farming. This includes topics like crop management, pest control, soil health, irrigation techniques, modern farming methods, and profitability.

  Always be friendly and encouraging in your tone. Keep your answers clear and easy to understand for farmers who may not be familiar with technical jargon.

  IMPORTANT: You must provide your entire response in the language specified by the following locale code: {{{locale}}}

  Here is the conversation history:
  {{#each history}}
    {{role}}: {{{content}}}
  {{/each}}

  Now, answer the user's latest message:
  user: {{{message}}}
  `,
});


const agriChatFlow = ai.defineFlow(
  {
    name: 'agriChatFlow',
    inputSchema: AgriChatInputSchema,
    outputSchema: z.string(),
  },
  async ({history, message, locale}) => {
    const llmResponse = await prompt({ history, message, locale });
    return llmResponse.text;
  }
);
