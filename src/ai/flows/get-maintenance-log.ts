
'use server';

/**
 * @fileoverview A maintenance log generation AI agent.
 * This file defines a Genkit flow that generates a predictive maintenance log for a given drone ID.
 *
 * It exports:
 * - getMaintenanceLog: An async function to be called from the UI, which invokes the Genkit flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { drones } from '@/lib/data'; // Using mock data for now

const MaintenanceLogInputSchema = z.string().describe('The ID of the drone.');
export type MaintenanceLogInput = z.infer<typeof MaintenanceLogInputSchema>;

const MaintenanceLogOutputSchema = z.string().describe('A detailed, predictive maintenance log in plain text format.');
export type MaintenanceLogOutput = z.infer<typeof MaintenanceLogOutputSchema>;

// This is the exported function that the UI will call.
export async function getMaintenanceLog(input: MaintenanceLogInput): Promise<MaintenanceLogOutput> {
  return getMaintenanceLogFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMaintenanceLogPrompt',
  input: { schema: MaintenanceLogInputSchema },
  output: { schema: MaintenanceLogOutputSchema },
  prompt: `
    You are an expert drone maintenance engineer for a company called "Buildora" that uses drones for construction material delivery.
    Your task is to generate a predictive maintenance log for a specific drone based on its data.

    Drone Data:
    - ID: {{droneId}}
    - Status: {{status}}
    - Battery Health: {{battery}}% (assume this is overall health, not just current charge)
    - Total Flight Hours: {{flightHours}}
    - Last Maintenance Date: {{lastMaintenance}}

    Based on the data above, generate a detailed maintenance log. The log should include:
    1.  A summary of the drone's current status.
    2.  A list of recommended checks (e.g., battery terminals, propeller integrity, sensor calibration).
    3.  A "Predictive Analysis" section identifying potential future issues based on flight hours and battery health. For example, if flight hours are high, suggest a motor inspection is due soon. If battery health is degrading, predict when a replacement might be needed.
    4.  A final recommendation on whether the drone is "Field Ready", "Requires Maintenance", or "Requires Urgent Attention".

    Format the output as a clean, readable text log.
  `,
});

const getMaintenanceLogFlow = ai.defineFlow(
  {
    name: 'getMaintenanceLogFlow',
    inputSchema: MaintenanceLogInputSchema,
    outputSchema: MaintenanceLogOutputSchema,
  },
  async (droneId) => {
    // In a real app, you would fetch this from a database.
    // For now, we'll use the mock data.
    const drone = drones.find((d) => d.id === droneId);

    if (!drone) {
      throw new Error(`Drone with ID ${droneId} not found.`);
    }

    const { output } = await prompt({
        droneId: drone.id,
        status: drone.status,
        battery: drone.battery,
        flightHours: drone.flightHours + Math.floor(Math.random() * 100), // Add random hours for variety
        lastMaintenance: drone.lastMaintenance,
    });

    return output!;
  }
);
