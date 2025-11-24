'use server';

/**
 * @fileOverview This file defines the Genkit flow for generating smart home product recommendations based on user inputs.
 *
 * - generateSmartHomeProducts - A function that orchestrates the smart home product recommendation process.
 * - GenerateSmartHomeProductsInput - The input type for the generateSmartHomeProducts function.
 * - GenerateSmartHomeProductsOutput - The return type for the generateSmartHomeProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSmartHomeProductsInputSchema = z.object({
  area: z.number().describe('The area of the property in square feet.'),
  layout: z
    .enum(['2R1L1B', '3R2L1B', '3R2L2B', '4R2L2B', '4R2L3B'])
    .describe('The layout of the property.'),
  budgetLevel: z.enum(['economy', 'premium', 'luxury']).describe('The budget tier selected by the user.'),
  floorPlanDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the floor plan, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  customNeeds: z.string().describe('Any custom needs or preferences specified by the user.'),
  productsJson: z.string().describe('The full JSON content of the products database.'),
  language: z.enum(['en', 'zh', 'ja', 'ko']).describe('The language for the response.'),
});
export type GenerateSmartHomeProductsInput = z.infer<typeof GenerateSmartHomeProductsInputSchema>;

const GenerateSmartHomeProductsOutputSchema = z.object({
  selectedItems: z.array(
    z.object({
      product_id: z.string().describe('The ID of the selected product.'),
      quantity: z.number().describe('The quantity of the product needed.'),
      room: z.string().describe('The room where the product will be used.'),
      reason: z.string().describe('The reason for selecting this product.'),
    })
  ).describe('The list of selected smart home products.'),
  analysisReport: z.string().describe('The analysis report in markdown format.'),
});
export type GenerateSmartHomeProductsOutput = z.infer<typeof GenerateSmartHomeProductsOutputSchema>;

export async function generateSmartHomeProducts(input: GenerateSmartHomeProductsInput): Promise<GenerateSmartHomeProductsOutput> {
  return generateSmartHomeProductsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSmartHomeProductsPrompt',
  input: {schema: GenerateSmartHomeProductsInputSchema},
  output: {schema: GenerateSmartHomeProductsOutputSchema},
  prompt: `You are an AI smart home consultant. Analyze the user's property details, budget, and needs to recommend a list of smart home products.

Generate the response in the following language: {{{language}}}

Property Details:
Area: {{{area}}} sq ft
Layout: {{{layout}}}
Budget Level: {{{budgetLevel}}}
Custom Needs: {{{customNeeds}}}
{{#if floorPlanDataUri}}
Floor Plan: {{media url=floorPlanDataUri}}
{{/if}}

Available Products:
{{{productsJson}}}

Based on the above information, select a list of smart home products that are suitable for the user. Consider their budget and needs when making your selections. The "room" and "reason" fields in the output must be in the requested language.

Return a JSON object with the following structure:
{
  "selected_items": [
    { "product_id": "1001", "quantity": 1, "room": "Living Room", "reason": "Central control hub" }
  ],
  "analysis_report": "Markdown string here..."
}

The analysis_report must be in the requested language ({{{language}}}) and must explain:
1. What features were compromised due to budget?
2. Suggestions for upgrades if budget allows.
3. Ways to save money.

Ensure the JSON is valid and contains no markdown wrapping.`, 
});

const generateSmartHomeProductsFlow = ai.defineFlow(
  {
    name: 'generateSmartHomeProductsFlow',
    inputSchema: GenerateSmartHomeProductsInputSchema,
    outputSchema: GenerateSmartHomeProductsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

