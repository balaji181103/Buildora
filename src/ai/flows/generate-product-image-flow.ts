
'use server';
/**
 * @fileOverview An AI flow for generating a product image.
 *
 * - generateProductImage: A function to generate a product image from a name and category.
 * - GenerateProductImageInput: The input type for the function.
 * - GenerateProductImageOutput: The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateProductImageInputSchema = z.object({
  name: z.string().describe('The name of the product.'),
  category: z.string().optional().describe('The category of the product.'),
});
export type GenerateProductImageInput = z.infer<typeof GenerateProductImageInputSchema>;

export const GenerateProductImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated product image.'),
});
export type GenerateProductImageOutput = z.infer<typeof GenerateProductImageOutputSchema>;

export async function generateProductImage(input: GenerateProductImageInput): Promise<GenerateProductImageOutput> {
  return await generateProductImageFlow(input);
}

const generateProductImageFlow = ai.defineFlow(
  {
    name: 'generateProductImageFlow',
    inputSchema: GenerateProductImageInputSchema,
    outputSchema: GenerateProductImageOutputSchema,
  },
  async (input) => {
    
    const imagePrompt = `A professional, clean, high-resolution e-commerce product photograph of a "${input.name}" from the category "${input.category || 'general'}". The product should be centered on a plain white or light gray background. The lighting should be bright and even, highlighting the product's details. No shadows, no other objects, no text, just the single product.`;
    
    const imageResponse = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: imagePrompt,
    });

    const imageUrl = imageResponse.media[0]?.url;

    if (!imageUrl) {
        throw new Error('Image generation failed to return a URL.');
    }

    return {
      imageUrl,
    };
  }
);
