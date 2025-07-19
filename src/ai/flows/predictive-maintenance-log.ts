// predictive-maintenance-log.ts
'use server';

/**
 * @fileOverview Generates predictive maintenance logs for drones using AI.
 *
 * - generateMaintenanceLog - A function that generates predictive maintenance logs for a specific drone.
 * - PredictiveMaintenanceLogInput - The input type for the generateMaintenanceLog function.
 * - PredictiveMaintenanceLogOutput - The return type for the generateMaintenanceLog function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictiveMaintenanceLogInputSchema = z.object({
  droneId: z.string().describe('The ID of the drone to generate a maintenance log for.'),
  flightHours: z.number().describe('Total flight hours of the drone.'),
  lastMaintenanceDate: z.string().describe('The date of the drone\'s last maintenance (YYYY-MM-DD).'),
  environmentConditions: z.string().describe('Description of the typical environmental conditions the drone operates in (e.g., hot, humid, dusty).'),
  sensorReadings: z.string().describe('Recent sensor readings from the drone (e.g., motor temperature, battery voltage).'),
});
export type PredictiveMaintenanceLogInput = z.infer<typeof PredictiveMaintenanceLogInputSchema>;

const PredictiveMaintenanceLogOutputSchema = z.object({
  log: z.string().describe('A detailed predictive maintenance log for the drone, including potential issues and recommended actions.'),
});
export type PredictiveMaintenanceLogOutput = z.infer<typeof PredictiveMaintenanceLogOutputSchema>;

export async function generateMaintenanceLog(input: PredictiveMaintenanceLogInput): Promise<PredictiveMaintenanceLogOutput> {
  return predictiveMaintenanceLogFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictiveMaintenanceLogPrompt',
  input: {schema: PredictiveMaintenanceLogInputSchema},
  output: {schema: PredictiveMaintenanceLogOutputSchema},
  prompt: `You are an AI assistant specializing in drone maintenance.
  Generate a predictive maintenance log for the drone with the following information:

  Drone ID: {{{droneId}}}
  Total Flight Hours: {{{flightHours}}}
  Last Maintenance Date: {{{lastMaintenanceDate}}}
  Environment Conditions: {{{environmentConditions}}}
  Recent Sensor Readings: {{{sensorReadings}}}

  Based on this information, provide a detailed maintenance log, including potential issues and recommended actions.
  The log should be comprehensive and actionable to help proactively address potential problems and minimize downtime.
  `,
});

const predictiveMaintenanceLogFlow = ai.defineFlow(
  {
    name: 'predictiveMaintenanceLogFlow',
    inputSchema: PredictiveMaintenanceLogInputSchema,
    outputSchema: PredictiveMaintenanceLogOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
