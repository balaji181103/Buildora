
'use server';
/**
 * @fileOverview An AI flow for generating a product image.
 *
 * - generateProductImage: A function to generate a product image from a name and category.
 */

import { ai } from '@/ai/genkit';
import { GenerateProductImageInputSchema, GenerateProductImageOutputSchema, type GenerateProductImageInput, type GenerateProductImageOutput } from '@/lib/types';

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
