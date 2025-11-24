'use server';

/**
 * @fileOverview This file defines the flow for generating smart home product recommendations based on user inputs, using a direct OpenAI-compatible API call.
 *
 * - generateSmartHomeProducts - A function that orchestrates the smart home product recommendation process.
 * - GenerateSmartHomeProductsInput - The input type for the generateSmartHomeProducts function.
 * - GenerateSmartHomeProductsOutput - The return type for the generateSmartHomeProducts function.
 */

import { z } from 'zod';
import OpenAI from 'openai';
import { generateAnalysisReport } from './generate-analysis-report';
import { products } from '@/lib/products';

const openai = new OpenAI({
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: 'https://api.siliconflow.cn/v1',
});

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
  const prompt = `你是一位AI智能家居顾问。请分析用户的房产信息、预算和需求，推荐一份智能家居产品清单。请使用中文进行回复。

房产信息:
面积: ${input.area} 平方米
户型: ${input.layout}
预算等级: ${input.budgetLevel}
定制需求: ${input.customNeeds}
${input.floorPlanDataUri ? `平面图: [Image Attached]` : ''}

可选产品列表:
${input.productsJson}

请根据以上信息，选择适合用户的智能家居产品。在选择时，请综合考虑用户的预算和需求。"room" 和 "reason" 字段必须使用中文。

重要：你必须返回一个有效的 JSON 对象。
该对象可以包含 "selectedItems" 和 "analysisReport" 两个键，或者仅包含 "selectedItems" 键。
不要在 JSON 对象前后添加任何其他文本、解释或 markdown 格式。

如果包含 "analysisReport"，其内容必须是中文的Markdown格式，并解释：
1.  由于预算限制，哪些功能打了折扣？
2.  如果预算允许，有哪些升级建议？
3.  有哪些省钱的方法？

JSON 对象结构示例:
{
  "selectedItems": [
    { "product_id": "1001", "quantity": 1, "room": "客厅", "reason": "中央控制中心" }
  ],
  "analysisReport": "Markdown格式的中文分析报告..."
}
`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
      ],
    },
  ];

  if (input.floorPlanDataUri) {
    (messages[0].content as any[]).push({
      type: 'image_url',
      image_url: {
        url: input.floorPlanDataUri,
      },
    });
  }

  const response = await openai.chat.completions.create({
    model: 'Qwen/Qwen3-VL-8B-Instruct',
    messages: messages,
    temperature: 0.5,
  });
  
  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('AI returned an empty response.');
  }

  try {
    const jsonMatch = content.match(/```(json)?\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[2] : content;
    const parsedJson = JSON.parse(jsonString);

    if (!parsedJson.analysisReport) {
        console.log("AI did not return an analysis report. Generating one separately.");
        
        const productMap = new Map(products.map((p) => [p.id, p]));
        const totalCost = parsedJson.selectedItems.reduce((acc: number, item: { product_id: string, quantity: number }) => {
            const product = productMap.get(item.product_id);
            return acc + (product ? product.price * item.quantity : 0);
        }, 0);

        const reportResult = await generateAnalysisReport({
            budgetLevel: input.budgetLevel,
            selectedItems: parsedJson.selectedItems,
            totalPrice: totalCost,
            area: input.area,
            layout: input.layout as any, // Cast because the enum is different
            customNeeds: input.customNeeds,
        });
        parsedJson.analysisReport = reportResult.analysisReport;
    }

    return GenerateSmartHomeProductsOutputSchema.parse(parsedJson);
  } catch (error) {
    console.error("Failed to parse AI response:", content, error);
    throw new Error('AI returned invalid JSON format or processing failed.');
  }
}
