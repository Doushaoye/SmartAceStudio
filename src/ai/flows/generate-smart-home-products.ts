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
  householdProfile: z.array(z.string()).optional().describe('Tags representing the user\'s household profile (e.g., "elderly", "pets").'),
  focusAreas: z.array(z.string()).optional().describe('Tags representing the user\'s main focus areas (e.g., "security", "entertainment").'),
  floorPlanDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the floor plan, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  customNeeds: z.string().describe('Any custom needs or preferences specified by the user.'),
  productsJson: z.string().describe('The JSON content of the available products database. This could be user-provided or the system default.'),
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

// Helper function to convert tags to natural language
function getContextFromTags(input: GenerateSmartHomeProductsInput): string {
    let context = '';
    
    if (input.householdProfile?.includes('elderly')) {
        context += "用户家有长辈。请优先考虑在走廊和卫生间配置自动化夜灯，并推荐使用操作简单的无线开关。\n";
    }
    if (input.householdProfile?.includes('pets')) {
        context += "用户家有宠物。建议推荐低角度的摄像头或能排除宠物干扰的移动传感器。\n";
    }
    if (input.householdProfile?.includes('kids')) {
        context += "用户家有小孩。请考虑儿童安全，例如使用无绳窗帘和安全插座。\n";
    }

    if (input.focusAreas?.includes('security')) {
        context += "用户非常关注家庭安防。请在预算中优先分配给智能门锁、摄像头和门窗传感器。\n";
    }
    if (input.focusAreas?.includes('entertainment')) {
        context += "用户注重影音娱乐体验。请推荐高质量的影音设备、智能电视和氛围灯光。\n";
    }
    if (input.focusAreas?.includes('lighting')) {
        context += "用户希望通过灯光营造氛围。请多推荐一些可调色温、亮度和颜色的智能灯具，如灯带、射灯等。\n";
    }
    if (input.focusAreas?.includes('automation')) {
        context += "用户是“懒人”，希望实现高度自动化。请多使用各类传感器（如人体、门窗、温湿度）来创建无感的自动化场景。\n";
    }
    if (input.focusAreas?.includes('energy')) {
        context += "用户关注节能环保。请推荐有电量统计功能的智能插座，并设置定时关闭电器的场景。\n";
    }

    return context;
}


export async function generateSmartHomeProducts(input: GenerateSmartHomeProductsInput): Promise<GenerateSmartHomeProductsOutput> {
  const tagContext = getContextFromTags(input);

  const prompt = `你是一位AI智能家居顾问。请分析用户的房产信息、预算和需求，推荐一份智能家居产品清单。请使用中文进行回复。

房产信息:
面积: ${input.area} 平方米
户型: ${input.layout}
预算等级: ${input.budgetLevel}

用户画像和核心需求 (根据用户选择的标签):
${tagContext || "用户未选择特定标签。"}

用户手写的定制需求:
${input.customNeeds || "无"}

${input.floorPlanDataUri ? `平面图: [Image Attached]` : ''}

产品库 (你必须从此列表里选择产品):
${input.productsJson}

请根据以上所有信息，特别是用户的画像、核心需求和手写需求，从提供的产品库中选择适合用户的智能家居产品。在选择时，请综合考虑用户的预算和需求。"room" 和 "reason" 字段必须使用中文。

重要：你必须返回一个有效的 JSON 对象。
该对象可以包含 "selectedItems" 和 "analysisReport" 两个键，或者仅包含 "selectedItems" 键。
不要在 JSON 对象前后添加任何其他文本、解释或 markdown 格式。

如果包含 "analysisReport"，其内容必须是中文的Markdown格式，并解释：
1.  与非智能家居相比，此方案实现了哪些自动化功能？
2.  由于预算限制，哪些功能打了折扣？
3.  如果预算允许，有哪些升级建议？
4.  有哪些省钱的方法？

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
        
        const productMap = new Map(JSON.parse(input.productsJson).map((p: any) => [p.id, p]));

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
