
'use server';
/**
 * @fileOverview An AI flow for generating product listings including a description and an image.
 *
 * - generateProductListing: A function to generate a product title, description and image.
 * - GenerateProductListingInput: The input type for the generateProductListing function.
 * - GenerateProductListingOutput: The return type for the generateProductListing function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateProductListingInputSchema = z.object({
  name: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product.'),
  description: z.string().optional().describe('An optional user-provided description to guide the AI.'),
});
export type GenerateProductListingInput = z.infer<typeof GenerateProductListingInputSchema>;

export const GenerateProductListingOutputSchema = z.object({
  description: z.string().describe('The generated product description, written in an engaging and professional tone for an e-commerce site.'),
});
export type GenerateProductListingOutput = z.infer<typeof GenerateProductListingOutputSchema>;


export async function generateProductListing(input: GenerateProductListingInput): Promise<GenerateProductListingOutput> {
  return await generateProductListingFlow(input);
}


const descriptionPrompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: { schema: GenerateProductListingInputSchema },
  output: { schema: GenerateProductListingOutputSchema },
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are a professional copywriter for a construction supply e-commerce website.

  Generate a compelling and professional product description based on the following product details.
  
  If a user-provided description exists, use it as inspiration but enhance it to be more engaging and detailed for a product listing.
  
  Product Name: {{{name}}}
  Category: {{{category}}}
  {{#if description}}
  User-provided description: {{{description}}}
  {{/if}}
  `,
});


const generateProductListingFlow = ai.defineFlow(
  {
    name: 'generateProductListingFlow',
    inputSchema: GenerateProductListingInputSchema,
    outputSchema: GenerateProductListingOutputSchema,
  },
  async (input) => {
    // Step 1: Await the description prompt first.
    const descriptionResponse = await descriptionPrompt(input);
    const generatedDescription = descriptionResponse.output?.description || '';

    return {
      description: generatedDescription,
    };
  }
);
