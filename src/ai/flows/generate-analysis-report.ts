'use server';

/**
 * @fileOverview A flow for generating an analysis report based on budget constraints,
 * suggesting upgrades, and offering cost-saving alternatives for a smart home plan.
 *
 * - generateAnalysisReport - A function that generates the analysis report.
 * - GenerateAnalysisReportInput - The input type for the generateAnalysisReport function.
 * - GenerateAnalysisReportOutput - The return type for the generateAnalysisReport function.
 */

import { z } from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: 'https://api.siliconflow.cn/v1',
});


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
  const selectedItemsString = input.selectedItems.map(item => 
    `- Product ID: ${item.product_id}, Quantity: ${item.quantity}, Room: ${item.room}, Reason: ${item.reason}`
  ).join('\n');

  const prompt = `You are a smart home consultant who provides an analysis report based on the user's smart home plan.

  The user has selected a budget tier of: ${input.budgetLevel}
  The total price of the selected items is: ${input.totalPrice}
  The area of the property is: ${input.area}
  The layout of the property is: ${input.layout}
  The user's custom needs are: ${input.customNeeds}

  Here are the selected items:
  ${selectedItemsString}

  Your analysis report should explain the following in markdown format:
  1. What automation functions does this plan achieve compared to a non-smart home? (e.g., automated lighting, scheduled curtains, etc.)
  2. What features were compromised due to budget?
  3. Suggestions for upgrades if the budget allows.
  4. Ways to save money.

  Return the analysis report as a markdown string.
  Make sure to mention specific products or categories of products in the report.
  Do not include any introductory or concluding sentences, just the analysis report in markdown format.
  
  Please provide the output as a JSON object with a single key "analysisReport" containing the markdown string.
  `;

  const response = await openai.chat.completions.create({
    model: 'Qwen/Qwen3-VL-8B-Instruct',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('AI returned an empty response.');
  }

  try {
    const parsedJson = JSON.parse(content);
    return GenerateAnalysisReportOutputSchema.parse(parsedJson);
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    // If parsing fails, we can try to return the raw content if it looks like the report
    if (typeof content === 'string' && (content.includes('省钱') || content.includes('升级'))) {
        return { analysisReport: content };
    }
    throw new Error('AI returned invalid JSON format.');
  }
}
