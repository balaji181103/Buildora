'use server';

import { generateMaintenanceLog, PredictiveMaintenanceLogInput } from '@/ai/flows/predictive-maintenance-log';

export async function getMaintenanceLog(input: PredictiveMaintenanceLogInput) {
  try {
    const result = await generateMaintenanceLog(input);
    if (!result || !result.log) {
      throw new Error('AI failed to generate a maintenance log.');
    }
    return { success: true, log: result.log };
  } catch (e) {
    console.error('Error generating maintenance log:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred. Please try again.';
    return { success: false, error: errorMessage };
  }
}
