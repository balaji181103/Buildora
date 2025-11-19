'use server';
/**
 * @fileOverview An AI agent for generating product listings.
 *
 * - generateProductListing - A function that handles product description and image generation.
 * - GenerateProductListingInput - The input type for the generateProductListing function.
 * - GenerateProductListingOutput - The return type for the generateProductListing function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProductListingInputSchema = z.object({
  name: z.string().describe('The name of the product.'),
  keywords: z
    .string()
    .describe(
      'A comma-separated list of keywords that describe the product.'
    ),
});
export type GenerateProductListingInput = z.infer<
  typeof GenerateProductListingInputSchema
>;

const GenerateProductListingOutputSchema = z.object({
  description: z.string().describe('The generated product description.'),
  imageDataUri: z
    .string()
    .describe('The generated product image as a data URI.'),
});
export type GenerateProductListingOutput = z.infer<
  typeof GenerateProductListingOutputSchema
>;

export async function generateProductListing(
  input: GenerateProductListingInput
): Promise<GenerateProductListingOutput> {
  return generateProductListingFlow(input);
}

const descriptionPrompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: { schema: GenerateProductListingInputSchema },
  output: { schema: z.object({ description: z.string() }) },
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert copywriter for an e-commerce store that sells construction materials and tools.

Your task is to generate a compelling, professional, and informative product description.

Use the following information about the product:
Product Name: {{{name}}}
Keywords: {{{keywords}}}

The description should be 2-3 paragraphs long. It should highlight the key features and benefits for a professional construction audience. Do not use overly sensational language. Focus on durability, efficiency, and quality.`,
});

const generateProductListingFlow = ai.defineFlow(
  {
    name: 'generateProductListingFlow',
    inputSchema: GenerateProductListingInputSchema,
    outputSchema: GenerateProductListingOutputSchema,
  },
  async (input) => {
    const [descriptionResponse, imageResponse] = await Promise.all([
      descriptionPrompt(input),
      ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `A professional, clean studio-quality photo of the following product: ${input.name}, ${input.keywords}. The product should be on a plain, solid white background.`,
      }),
    ]);

    const description = descriptionResponse.output?.description || '';
    const imageDataUri = imageResponse.media?.url || '';

    return { description, imageDataUri };
  }
);
