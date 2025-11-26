'use server';

/**
 * @fileOverview A flow for generating an analysis report based on budget constraints,
 * suggesting upgrades, and offering cost-saving alternatives for a smart home plan.
 *
 * - generateAnalysisReport - A function that generates the analysis report.
 * - GenerateAnalysisReportInput - The input type for the generateAnalysisReport function.
 * - GenerateAnalysisReportOutput - The return type for the generateAnalysisReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

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
  layout: z.enum(['2r1l1b', '3r2l1b', '3r2l2b', '4r2l2b', '4r2l3b']).describe('The layout of the property.'),
  customNeeds: z.string().describe('The custom needs specified by the user.'),
});
export type GenerateAnalysisReportInput = z.infer<typeof GenerateAnalysisReportInputSchema>;

const GenerateAnalysisReportOutputSchema = z.object({
  analysisReport: z.string().describe('A markdown string containing the analysis report.'),
});
export type GenerateAnalysisReportOutput = z.infer<typeof GenerateAnalysisReportOutputSchema>;


const reportPrompt = ai.definePrompt({
    name: 'generateAnalysisReportPrompt',
    input: { schema: GenerateAnalysisReportInputSchema },
    output: { schema: GenerateAnalysisReportOutputSchema },
    prompt: `You are a smart home consultant who provides an analysis report based on the user's smart home plan.

  The user has a property with an area of {{area}} sqm and a {{layout}} layout.
  The selected budget tier is '{{budgetLevel}}'.
  The total price of the selected items is: {{totalPrice}}.
  The user's custom needs are: "{{customNeeds}}".

  Here are the selected items that form the plan:
  {{#each selectedItems}}
  - Product ID: {{product_id}}, Quantity: {{quantity}}, Room: {{room}}, Reason: {{reason}}
  {{/each}}

  Please write a concise analysis report in Chinese, using markdown format. The report should cover these four points:
  1.  **方案价值**: 简单说明与非智能家居相比，这个方案实现了哪些核心的自动化功能 (例如: 自动照明, 定时窗帘等)?
  2.  **预算权衡**: 基于预算等级，哪些更高级的功能或产品体验打了折扣?
  3.  **升级建议**: 如果预算更充足，可以从哪些方面进行升级，可以推荐具体产品品类?
  4.  **省钱技巧**: 有哪些可以节省成本的替代方案或技巧?

  IMPORTANT:
  - Your entire response must be a single JSON object.
  - The JSON object must have one key: "analysisReport".
  - The value of "analysisReport" must be a markdown string containing the report.
  - Do not add any introductory or concluding text outside of the markdown report itself.
  `
});

const generateAnalysisReportFlow = ai.defineFlow(
  {
    name: 'generateAnalysisReportFlow',
    inputSchema: GenerateAnalysisReportInputSchema,
    outputSchema: GenerateAnalysisReportOutputSchema,
  },
  async (input) => {
    console.log('[流程步骤] 6/7: 正在调用 AI 生成分析报告...');
    const { output } = await reportPrompt(input);
    if (!output) {
      console.error("[解析错误] AI分析报告返回了空内容。");
      throw new Error('AI returned an empty response for analysis report.');
    }
    console.log("[流程步骤] 6.5/7: 成功收到分析报告AI响应。");
    return output;
  }
);

export async function generateAnalysisReport(input: GenerateAnalysisReportInput): Promise<GenerateAnalysisReportOutput> {
  return await generateAnalysisReportFlow(input);
}
