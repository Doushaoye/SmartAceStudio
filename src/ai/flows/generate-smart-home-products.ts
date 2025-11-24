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
    .enum(['2r1l1b', '3r2l1b', '3r2l2b', '4r2l2b', '4r2l3b'])
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
  model: 'THUDM/GLM-4.1V-9B-Thinking',
  input: {schema: GenerateSmartHomeProductsInputSchema},
  output: {schema: GenerateSmartHomeProductsOutputSchema},
  prompt: `你是一位AI智能家居顾问。请分析用户的房产信息、预算和需求，推荐一份智能家居产品清单。请使用中文进行回复。

房产信息:
面积: {{{area}}} 平方米
户型: {{{layout}}}
预算等级: {{{budgetLevel}}}
定制需求: {{{customNeeds}}}
{{#if floorPlanDataUri}}
平面图: {{media url=floorPlanDataUri}}
{{/if}}

可选产品列表:
{{{productsJson}}}

请根据以上信息，选择适合用户的智能家居产品。在选择时，请综合考虑用户的预算和需求。"room" 和 "reason" 字段必须使用中文。

请返回一个包含以下结构的JSON对象:
{
  "selectedItems": [
    { "product_id": "1001", "quantity": 1, "room": "客厅", "reason": "中央控制中心" }
  ],
  "analysisReport": "Markdown格式的分析报告..."
}

analysis_report必须是中文的Markdown格式，并解释：
1.  由于预算限制，哪些功能打了折扣？
2.  如果预算允许，有哪些升级建议？
3.  有哪些省钱的方法？

确保返回的JSON是有效的，并且不包含任何Markdown包装。`,
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
