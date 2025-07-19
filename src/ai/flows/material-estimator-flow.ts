
'use server';

/**
 * @fileOverview An AI flow for estimating construction materials like bricks and cement.
 * 
 * - estimateMaterials - A function that handles the material estimation process.
 * - MaterialEstimatorInput - The input type for the estimateMaterials function.
 * - MaterialEstimatorOutput - The return type for the estimateMaterials function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MaterialEstimatorInputSchema = z.object({
  length: z.number().describe('The length of the structure in meters.'),
  width: z.number().describe('The width of the structure in meters.'),
  height: z.number().describe('The height of the structure in meters.'),
  projectType: z.enum(['brickwork', 'concreting']).describe('The type of construction project.'),
});
export type MaterialEstimatorInput = z.infer<typeof MaterialEstimatorInputSchema>;

const MaterialSchema = z.object({
    name: z.string().describe('The name of the material (e.g., Bricks, Cement, Sand).'),
    quantity: z.string().describe('The estimated quantity of the material, including units (e.g., 500 bricks, 10 bags, 2 cubic meters).'),
});

const MaterialEstimatorOutputSchema = z.object({
  materials: z.array(MaterialSchema).describe('A list of estimated materials required for the project.'),
  notes: z.string().describe('Important notes, assumptions, or recommendations regarding the estimate (e.g., wastage percentage, mix ratios).'),
});
export type MaterialEstimatorOutput = z.infer<typeof MaterialEstimatorOutputSchema>;

export async function estimateMaterials(input: MaterialEstimatorInput): Promise<MaterialEstimatorOutput> {
  return materialEstimatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'materialEstimatorPrompt',
  input: { schema: MaterialEstimatorInputSchema },
  output: { schema: MaterialEstimatorOutputSchema },
  prompt: `You are an expert construction material estimator for projects in India.
  Your task is to calculate the required materials for a project based on the provided dimensions and project type.

  Project Details:
  - Project Type: {{{projectType}}}
  - Dimensions: {{{length}}}m (length) x {{{width}}}m (width) x {{{height}}}m (height)

  Calculations should be based on standard Indian construction practices.
  - For 'brickwork', assume a standard brick size of 190mm x 90mm x 90mm and a mortar thickness of 10mm. Calculate the number of bricks and the required cement (in 50kg bags) and sand (in cubic meters) for the mortar (assume a 1:6 cement-sand ratio). The calculation should be for a wall with the given length, height, and a standard width of 0.23m (9-inch wall).
  - For 'concreting', calculate the volume of concrete required. Then, determine the amount of cement (in 50kg bags), sand (in cubic meters), and aggregate (in cubic meters) needed for a standard M20 grade concrete mix (1:1.5:3 ratio).

  Provide the output as a list of materials with their quantities.
  Include a 'notes' section mentioning the assumptions made (e.g., mix ratio, wastage not included, standard brick size).
  `,
});

const materialEstimatorFlow = ai.defineFlow(
  {
    name: 'materialEstimatorFlow',
    inputSchema: MaterialEstimatorInputSchema,
    outputSchema: MaterialEstimatorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
