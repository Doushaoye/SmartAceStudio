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
  lightingStyle: z.string().optional().describe('The user\'s preferred lighting design style.'),
  ecosystem: z.string().optional().describe('The user\'s preferred smart home ecosystem.'),
  floorPlanDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the floor plan, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
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

    switch (input.lightingStyle) {
        case 'italian-minimalist':
        case 'modern-simple':
            context += "用户的灯光风格偏向意式极简或现代简约，大概率是无主灯设计，请多使用筒灯、射灯、灯带等分布式光源，避免或减少使用大型主灯。\n";
            break;
        case 'french':
        case 'american':
            context += "用户的灯光风格偏向法式或美式，设计中应以一个华丽的主灯或花灯为核心，并辅以筒灯和射灯作为补充照明。\n";
            break;
        case 'shanghai-style':
        case 'creamy-style':
            context += "用户的灯光风格偏向海派或奶油风，设计中应以主灯为主，并搭配适量的筒灯和射灯来丰富照明层次。\n";
            break;
    }


    return context;
}

const ProductSelectionOutputSchema = z.object({
  selectedItems: z.array(
    z.object({
      product_id: z.string().describe('The ID of the selected product.'),
      quantity: z.number().describe('The quantity of the product needed.'),
      room: z.string().describe('The room where the product will be used.'),
      reason: z.string().describe('The reason for selecting this product.'),
    })
  ).describe('The list of selected smart home products.'),
});

export async function generateSmartHomeProducts(input: GenerateSmartHomeProductsInput): Promise<GenerateSmartHomeProductsOutput> {
  const tagContext = getContextFromTags(input);

  const selectionPrompt = `你是一位AI智能家居顾问。请分析用户的房产信息、预算和需求，推荐一份智能家居产品清单。请使用中文进行回复。

房产信息:
面积: ${input.area} 平方米
户型: ${input.layout}
预算等级: ${input.budgetLevel}

生态平台选择规则 (最重要):
用户选择的优先智能生态是: 【${input.ecosystem}】。你选择的所有产品，其“生态”字段中必须包含【${input.ecosystem}】这个标签。绝对不能选择任何不兼容该生态的产品。

预算选择规则 (重要):
- 如果预算是 'luxury' (豪华), 你可以使用 'luxury', 'premium', 'economy' 三个等级的产品。
- 如果预算是 'premium' (高级), 你可以使用 'premium' 和 'economy' 等级的产品。
- 如果预算是 'economy' (经济), 你应该尽量只选择 'economy' 等级的产品，除非绝对必要。

产品选择规则 (重要):
- 产品库中有些产品标注了 "来源": "用户自定义"，请优先选择这些产品。
- 如果用户自定义的产品不足以完成方案设计，你可以从产品库中选择其他产品作为补充。

用户画像、核心需求和灯光风格偏好 (根据用户选择的标签):
${tagContext || "用户未选择特定标签。"}

用户手写的定制需求:
${input.customNeeds || "无"}

${input.floorPlanDataUri ? `平面图: [Image Attached]` : ''}

产品库 (你必须从此列表里选择产品，产品属性描述均为中文，特别是要遵守【生态平台选择规则】):
${input.productsJson}

请根据以上所有信息，特别是用户的画像、核心需求和手写需求，并严格遵守【生态平台选择规则】、【预算选择规则】和【产品选择规则】，从提供的产品库中选择适合用户的智能家居产品。在选择时，请综合考虑用户的预算和需求。"room" 和 "reason" 字段必须使用中文。

重要：你必须返回一个只包含 "selectedItems" 键的有效 JSON 对象。
不要在 JSON 对象前后添加任何其他文本、解释或 markdown 格式。

JSON 对象结构示例:
{
  "selectedItems": [
    { "product_id": "1001", "quantity": 1, "room": "客厅", "reason": "中央控制中心" }
  ]
}
`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: selectionPrompt },
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

  try {
    // Step 1: Get product selection
    const selectionResponse = await openai.chat.completions.create({
      model: 'Qwen/Qwen3-VL-8B-Instruct',
      messages: messages,
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });
    
    const selectionContent = selectionResponse.choices[0].message.content;
    if (!selectionContent) {
      throw new Error('AI returned an empty response for product selection.');
    }

    const parsedSelection = ProductSelectionOutputSchema.parse(JSON.parse(selectionContent));

    // Step 2: Generate analysis report
    const productMap = new Map(JSON.parse(input.productsJson).map((p: any) => [p.ID, p]));
    const totalCost = parsedSelection.selectedItems.reduce((acc, item) => {
        const product = productMap.get(item.product_id);
        return acc + (product ? product.价格 * item.quantity : 0);
    }, 0);

    const reportResult = await generateAnalysisReport({
        budgetLevel: input.budgetLevel,
        selectedItems: parsedSelection.selectedItems,
        totalPrice: totalCost,
        area: input.area,
        layout: input.layout as any, // Cast because the enum is different
        customNeeds: input.customNeeds,
    });

    // Step 3: Combine results
    const finalResult = {
        selectedItems: parsedSelection.selectedItems,
        analysisReport: reportResult.analysisReport,
    };

    return GenerateSmartHomeProductsOutputSchema.parse(finalResult);

  } catch (error) {
    console.error("Failed during AI processing:", error);
    throw new Error('AI returned invalid JSON format or processing failed.');
  }
}
