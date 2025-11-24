'use server';

/**
 * @fileOverview A flow for generating an analysis report based on budget constraints,
 * suggesting upgrades, and offering cost-saving alternatives for a smart home plan.
 *
 * - generateAnalysisReport - A function that generates the analysis report.
 * - GenerateAnalysisReportInput - The input type for the generateAnalysisReport function.
 * - GenerateAnalysisReportOutput - The return type for the generateAnalysisReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAnalysisReportInputSchema = z.object({
  budgetLevel: z.enum(['economy', 'premium', 'luxury']).describe('The budget tier selected by the user.'),
  selectedItems: z.array(
    z.object({
      product_id: z.string().describe('The ID of the selected product.'),
      quantity: z.number().describe('The quantity of the product selected.'),
      room: z.string().describe('The room where the product will be installed.'),
      reason: z.string().describe('The reason for selecting this product.'),
    })
  ).describe('The list of selected smart home products.'),
  totalPrice: z.number().describe('The total calculated price of the selected items.'),
  area: z.number().describe('The area of the property in square feet.'),
  layout: z.enum(['Studio', '1B1B', '2B1B', '3B2B', 'Villa']).describe('The layout of the property.'),
  customNeeds: z.string().describe('The custom needs specified by the user.'),
});
export type GenerateAnalysisReportInput = z.infer<typeof GenerateAnalysisReportInputSchema>;

const GenerateAnalysisReportOutputSchema = z.object({
  analysisReport: z.string().describe('A markdown string containing the analysis report.'),
});
export type GenerateAnalysisReportOutput = z.infer<typeof GenerateAnalysisReportOutputSchema>;

export async function generateAnalysisReport(input: GenerateAnalysisReportInput): Promise<GenerateAnalysisReportOutput> {
  return generateAnalysisReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAnalysisReportPrompt',
  input: {schema: GenerateAnalysisReportInputSchema},
  output: {schema: GenerateAnalysisReportOutputSchema},
  prompt: `You are a smart home consultant who provides an analysis report based on the user's smart home plan.

  The user has selected a budget tier of: {{{budgetLevel}}}
  The total price of the selected items is: {{{totalPrice}}}
  The area of the property is: {{{area}}}
  The layout of the property is: {{{layout}}}
  The user's custom needs are: {{{customNeeds}}}

  Here are the selected items:
  {{#each selectedItems}}
  - Product ID: {{{product_id}}}, Quantity: {{{quantity}}}, Room: {{{room}}}, Reason: {{{reason}}}
  {{/each}}

  Your analysis report should explain the following:
  1.  What features were compromised due to budget?
  2.  Suggestions for upgrades if the budget allows.
  3.  Ways to save money.

  Return the analysis report as a markdown string.
  Make sure to mention specific products or categories of products in the report.
  Do not include any introductory or concluding sentences, just the analysis report in markdown format.
  `,
});

const generateAnalysisReportFlow = ai.defineFlow(
  {
    name: 'generateAnalysisReportFlow',
    inputSchema: GenerateAnalysisReportInputSchema,
    outputSchema: GenerateAnalysisReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {analysisReport: output!.analysisReport!};
  }
);
