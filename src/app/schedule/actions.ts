"use server";

import { requireAiUser, AuthError } from '@/lib/server-auth';
import {
  generateSchedule as performScheduleGeneration,
  type GenerateScheduleInput,
  type GenerateScheduleOutput,
} from '@/ai/flows/generate-schedule-flow';

// We need the task type from the client component to map the output
type ClientTask = {
  activity: 'Planting' | 'Fertilizing' | 'Harvesting' | 'Weeding' | 'Pest Control' | 'Irrigation';
  crop: string;
  date: string;
};

export async function generateAISchedule(
  idToken: string,
  input: GenerateScheduleInput
): Promise<ClientTask[]> {
  try {
    await requireAiUser(idToken);
    const output = await performScheduleGeneration(input);
    // Map the AI output to the format expected by the client
    const mappedTasks = output.tasks.map(task => ({
      ...task,
      crop: `${input.cropName} (${input.fieldName})`, // Combine crop and field name
    }));
    return mappedTasks;
  } catch (error) {
    if (error instanceof AuthError) throw new Error(error.message);
    console.error('Error generating AI schedule:', error);
    throw new Error('Failed to get schedule from AI.');
  }
}
