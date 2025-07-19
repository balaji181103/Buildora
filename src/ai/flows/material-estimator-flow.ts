
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
    name: z.string().describe('The name of the material (e.g., Bricks, Cement, Sand, Total Cost).'),
    quantity: z.string().describe('The estimated quantity or value of the item, including units or currency (e.g., 500 bricks, 10 bags, ₹17,500).'),
});

const MaterialEstimatorOutputSchema = z.object({
  materials: z.array(MaterialSchema).describe('A list of estimated materials required for the project, including a total cost.'),
  notes: z.string().describe('Important notes, assumptions, or recommendations regarding the estimate (e.g., wastage percentage, mix ratios, cost per unit).'),
});
export type MaterialEstimatorOutput = z.infer<typeof MaterialEstimatorOutputSchema>;

export async function estimateMaterials(input: MaterialEstimatorInput): Promise<MaterialEstimatorOutput> {
  return materialEstimatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'materialEstimatorPrompt',
  input: { schema: MaterialEstimatorInputSchema },
  output: { schema: MaterialEstimatorOutputSchema },
  prompt: `You are an AI construction estimator. Your task is to calculate the required materials for a project based on the provided details.

  Project Details:
  - Project Type: {{{projectType}}}
  - Wall Dimensions: {{{length}}} ft (length) x {{{height}}} ft (height) x {{{width}}} ft (thickness)
  {{#if brickType}}- Brick Type: {{{brickType}}}{{/if}}

  Calculations:
  - If the project type is 'brickwork' and the brick type is 'alo_block':
    1. The standard ALO Block size is 4" (W) × 6" (H) × 9" (L). One block covers approximately 0.375 square feet ( (9 * 6) / 144 ).
    2. Calculate the wall's surface area in square feet (length × height).
    3. Calculate the number of blocks required by dividing the surface area by the coverage per block (0.375).
    4. Add a 5% buffer for waste and breakage. Round up to the nearest whole number. This is the 'Total Bricks Required'.
    5. The cost of one ALO block is ₹35. Calculate the 'Total Block Cost' (Total Bricks Required × 35).
    6. Also calculate the required cement (in 50kg bags) and sand (in cubic meters) for the mortar (assume a 1:6 cement-sand ratio with 10mm thickness).
    7. Your output for 'materials' should list "ALO Blocks", "Cement", "Sand", and "Total Cost".

  - If the project type is 'brickwork' and the brick type is 'red_brick':
    1. The standard Red Brick size is 7.5" x 3.5" x 3.5". Convert brick dimensions to meters for calculation (1 inch = 0.0254 meters). Assume a standard mortar thickness of 10mm (0.01m).
    2. Calculate the number of bricks required for a single wall with the given length and height. Use the width provided by the user for the wall thickness.
    3. Then, calculate the required cement (in 50kg bags) and sand (in cubic meters) for the mortar (assume a 1:6 cement-sand ratio).

  - If the project type is 'concreting':
    1. Convert dimensions from FEET to METERS (1 foot = 0.3048 meters).
    2. Calculate the volume of concrete required in cubic meters.
    3. Determine the amount of cement (in 50kg bags), sand (in cubic meters), and aggregate (in cubic meters) needed for a standard M20 grade concrete mix (1:1.5:3 ratio).
  
  Provide the output as a list of materials with their quantities.
  For the 'notes' field, include key assumptions like the buffer percentage, cost per ALO block, mix ratios, and the original dimensions provided by the user.
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
