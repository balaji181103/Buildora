
'use server';

/**
 * @fileOverview An AI flow for estimating construction materials like bricks and cement.
 * 
 * - estimateMaterials - A function that handles the material estimation process.
 * - MaterialEstimatorInput - The input type for the estimateMaterials function.
 * - MaterialEstimatorOutput - The return type for the estimateMaterials function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MaterialEstimatorInputSchema = z.object({
  length: z.number().describe('The length of the structure in feet.'),
  width: z.number().describe('The width of the structure in feet.'),
  height: z.number().describe('The height of the structure in feet.'),
  projectType: z.enum(['brickwork', 'concreting']).describe('The type of construction project.'),
  brickType: z.enum(['alo_block', 'red_brick']).optional().describe('The type of brick to be used for brickwork.'),
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
  The user has provided the dimensions in FEET. You must convert them to meters for your calculations (1 foot = 0.3048 meters).

  Project Details:
  - Project Type: {{{projectType}}}
  {{#if brickType}}- Brick Type: {{{brickType}}}{{/if}}
  - Dimensions: {{{length}}}ft (length) x {{{width}}}ft (width) x {{{height}}}ft (height)

  Calculations should be based on standard Indian construction practices.
  - For 'brickwork', use the specified brick type for calculations. The standard sizes in inches are: ALO Block (4" x 6" x 9") and Red Brick (7.5" x 3.5" x 3.5"). Convert brick dimensions to meters for calculation (1 inch = 0.0254 meters). Assume a standard mortar thickness of 10mm (0.01m). Calculate the number of bricks required. Then, calculate the required cement (in 50kg bags) and sand (in cubic meters) for the mortar (assume a 1:6 cement-sand ratio). The calculation should be for a single wall with the given length and height. Use the width provided by the user for the wall thickness.
  - For 'concreting', after converting dimensions to meters, calculate the volume of concrete required. Then, determine the amount of cement (in 50kg bags), sand (in cubic meters), and aggregate (in cubic meters) needed for a standard M20 grade concrete mix (1:1.5:3 ratio).

  Provide the output as a list of materials with their quantities.
  Include a 'notes' section mentioning the assumptions made (e.g., mix ratio, wastage not included, brick sizes used, conversion from feet to meters).
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

    