
'use server';

import { estimateMaterials, MaterialEstimatorInput } from '@/ai/flows/material-estimator-flow';

export async function getMaterialEstimate(input: MaterialEstimatorInput) {
  try {
    const result = await estimateMaterials(input);
    if (!result || !result.materials) {
      throw new Error('AI failed to generate a material estimate.');
    }
    return { success: true, estimate: result };
  } catch (e) {
    console.error('Error generating material estimate:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred. Please try again.';
    return { success: false, error: errorMessage };
  }
}
