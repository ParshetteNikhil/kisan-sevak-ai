'use server';

import {
  getChatResponse as performChat,
  type ChatMessage,
} from '@/ai/flows/agri-chat-flow';

export async function getChatResponse(
  history: ChatMessage[],
  message: string,
  locale: string
): Promise<string> {
  try {
    const response = await performChat(history, message, locale);
    return response;
  } catch (error) {
    console.error('Error getting chat response:', error);
    throw new Error('Failed to get response from AI.');
  }
}
