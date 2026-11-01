'use server';
/**
 * @fileOverview An AI agent for generating a farming schedule for a specific crop.
 *
 * - generateSchedule - A function that handles the schedule generation process.
 * - GenerateScheduleInput - The input type for the generateSchedule function.
 * - GenerateScheduleOutput - The return type for the generateSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {localeField, FARMER_LANGUAGE_RULE} from '@/ai/language';

const GenerateScheduleInputSchema = z.object({
  locale: localeField,
  cropName: z.string().describe('The name of the crop.'),
  plantingDate: z
    .string()
    .describe('The date the crop was planted, in YYYY-MM-DD format.'),
  fieldName: z.string().describe('The name of the field or plot.'),
});
export type GenerateScheduleInput = z.infer<typeof GenerateScheduleInputSchema>;


const TaskSchema = z.object({
    activity: z.enum(['Planting', 'Fertilizing', 'Harvesting', 'Weeding', 'Pest Control', 'Irrigation'])
      .describe('The type of farming activity.'),
    date: z.string().describe('The suggested date for the activity in YYYY-MM-DD format.'),
});

const GenerateScheduleOutputSchema = z.object({
  tasks: z.array(TaskSchema).describe("A list of suggested farming tasks with their recommended dates."),
});

export type GenerateScheduleOutput = z.infer<typeof GenerateScheduleOutputSchema>;

export async function generateSchedule(input: GenerateScheduleInput): Promise<GenerateScheduleOutput> {
  return generateScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSchedulePrompt',
  input: {schema: GenerateScheduleInputSchema},
  output: {schema: GenerateScheduleOutputSchema},
  prompt: FARMER_LANGUAGE_RULE + `You are an expert agronomist providing a farming schedule. A farmer is planting '{{{cropName}}}' in '{{{fieldName}}}' on '{{{plantingDate}}}'.

Based on standard agricultural practices for '{{{cropName}}}', generate a list of key activities from planting to harvest.
The list should include tasks like 'Fertilizing', 'Weeding', 'Pest Control', 'Irrigation', and 'Harvesting'.
Calculate and provide a specific, estimated date (YYYY-MM-DD) for each activity relative to the provided planting date.
The planting date itself should not be one of the generated tasks.
Return the schedule as a JSON object containing a 'tasks' array.
`,
});

const generateScheduleFlow = ai.defineFlow(
  {
    name: 'generateScheduleFlow',
    inputSchema: GenerateScheduleInputSchema,
    outputSchema: GenerateScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
