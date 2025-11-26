'use server';

/**
 * @fileOverview This file defines the flow for generating smart home product recommendations.
 *
 * - generateSmartHomeProducts - A function that orchestrates the smart home product recommendation process.
 * - GenerateSmartHomeProductsInput - The input type for the function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateAnalysisReport } from './generate-analysis-report';
import type { Product, EnrichedItem, Proposal } from '@/lib/products';
import { products } from '@/lib/products-data';
import crypto from 'crypto';
import Papa from 'papaparse';


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
  productsCsv: z.string().optional().describe('The CSV content of the user-provided products.'),
});
export type GenerateSmartHomeProductsInput = z.infer<typeof GenerateSmartHomeProductsInputSchema>;


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


function toChineseKeys(product: any, isCustom: boolean) {
  const result: any = {
    'ID': product.id,
    '名称': product.name,
    '品牌': product.brand,
    '品类': product.category,
    '价格': product.price,
    '生态': product.ecosystem,
    '描述': product.description,
  };
  if (isCustom) {
    result['来源'] = '用户自定义';
  }
  return result;
}

const generateSmartHomeProductsFlow = ai.defineFlow(
  {
    name: 'generateSmartHomeProductsFlow',
    inputSchema: GenerateSmartHomeProductsInputSchema,
    outputSchema: z.custom<Proposal>()
  },
  async (input) => {
    console.log('[流程步骤] 1/7: 开始智能家居方案生成。接收到输入:', input);

    if (!process.env.AI_MODEL_NAME) {
        throw new Error("AI_MODEL_NAME 环境变量未设置。");
    }
    
    if (process.env.SILICONFLOW_API_KEY && !process.env.AI_MODEL_NAME?.startsWith('gemini')) {
        console.log('[配置检查] 检测到 SiliconFlow API 密钥，将使用 OpenAI 兼容模式。');
    } else if (process.env.GEMINI_API_KEY && process.env.AI_MODEL_NAME?.startsWith('gemini')) {
        console.log('[配置检查] 检测到 Gemini API 密钥，将使用 Google AI 模式。');
    } else {
        throw new Error('缺少有效的 AI 服务配置。请检查 .env 文件中的 API 密钥和模型名称。');
    }

    const customProductsForEnrichment: Product[] = [];
    
    let productsJson: string;

    if (input.productsCsv) {
        console.log('[流程步骤] 检测到用户上传自定义产品库。');
        const parseResult = Papa.parse(input.productsCsv, {
            header: true,
            skipEmptyLines: true,
        });

        if (parseResult.errors.length > 0) {
            throw new Error(`CSV parsing error: ${parseResult.errors.map(e => e.message).join(', ')}`);
        }
        
        const customProductsData: any[] = parseResult.data;

        const simplifiedCustomProducts = customProductsData.map((row: any) => {
            const customProduct: Product = {
                id: `USER-${crypto.randomUUID()}`,
                name: row['产品名称'],
                brand: row['品牌'],
                category: row['品类'],
                price: Number(row['价格']),
                ecosystem: row['生态平台(用;分隔)']?.split(';').map((e: string) => e.trim()).filter(Boolean) || [],
                description: row['产品描述'],
                budget_level: 'economy', // Default to economy
                imageUrl: `https://picsum.photos/seed/${crypto.randomUUID()}/400/400`,
            };
            customProductsForEnrichment.push(customProduct);
            return toChineseKeys(customProduct, true);
        });
        
        const defaultSimplifiedProducts = products.map(p => toChineseKeys(p, false));
        productsJson = JSON.stringify([...simplifiedCustomProducts, ...defaultSimplifiedProducts]);
    } else {
        productsJson = JSON.stringify(products.map(p => toChineseKeys(p, false)));
    }
    console.log('[流程步骤] 2/7: 已准备好产品数据 JSON。');
    
    const tagContext = getContextFromTags(input);

    const promptParts = [
        `你是一位AI智能家居顾问。请分析用户的房产信息、预算和需求，推荐一份智能家居产品清单。请使用中文进行回复。`,
        `房产信息:\n面积: ${input.area} 平方米\n户型: ${input.layout}\n预算等级: ${input.budgetLevel}`,
        `生态平台选择规则 (最重要):\n用户选择的优先智能生态是: 【${input.ecosystem}】。你选择的所有产品，其“生态”字段中必须包含【${input.ecosystem}】这个标签。绝对不能选择任何不兼容该生态的产品。`,
        `智能开关选择规则 (最重要):\n1.  全屋都需要配置智能开关，不要为了省钱而选择用普通开关替代智能开关。\n2.  卧室、客厅区域至少要配置一对3键开关实现灯光的双控，如果这个空间还有电动窗帘则需要考虑补充更多的开关。\n3.  卫生间，厨房区域配置1键或2键开关即可。\n4.  阳台区域因为有电动窗帘和晾衣架，建议用三键开关。\n5.  玄关区域推荐使用3键或者智能屏来实现回家离家模式等场景控制需求。`,
        `预算选择规则 (重要):\n- 如果预算是 'luxury' (豪华), 你可以使用 'luxury', 'premium', 'economy' 三个等级的产品。\n- 如果预算是 'premium' (高级), 你可以使用 'premium' 和 'economy' 等级的产品。\n- 如果预算是 'economy' (经济), 你应该尽量只选择 'economy' 等级的产品，除非绝对必要。`,
        `产品选择规则 (重要):\n- 产品库中有些产品标注了 "来源": "用户自定义"，请优先选择这些产品。\n- 如果用户自定义的产品不足以完成方案设计，你可以从产品库中选择其他产品作为补充。`,
        `用户画像、核心需求和灯光风格偏好 (根据用户选择的标签):\n${tagContext || "用户未选择特定标签。"}`,
        `用户手写的定制需求:\n${input.customNeeds || "无"}`,
    ];

    if (input.floorPlanDataUri) {
        promptParts.push(`平面图: {{media url=${input.floorPlanDataUri}}}`);
    }

    promptParts.push(`产品库 (你必须从此列表里选择产品，产品属性描述均为中文，特别是要遵守【生态平台选择规则】和【智能开关选择规则】):\n${productsJson}`);
    promptParts.push(`请根据以上所有信息，特别是用户的画像、核心需求和手写需求，并严格遵守所有规则，从提供的产品库中选择适合用户的智能家居产品。在选择时，请综合考虑用户的预算和需求。"room" 和 "reason" 字段必须使用中文。`);
    promptParts.push(`你的回复必须是一个符合以下 ProductSelectionOutputSchema 格式的 JSON 对象，不能包含任何额外的解释或 markdown 格式。\n最终 JSON 对象结构示例:\n{ "selectedItems": [ { "product_id": "1001", "quantity": 1, "room": "客厅", "reason": "中央控制中心" } ] }`);

    const prompt = promptParts.join('\n\n');
    
    console.log('[流程步骤] 3/7: 正在调用 AI 进行产品选择...');
    const response = await ai.generate({
        model: process.env.AI_MODEL_NAME,
        prompt: prompt,
        output: {
          format: 'json',
          schema: ProductSelectionOutputSchema,
        },
    });

    const parsedSelection = response.output();
    
    if (!parsedSelection) {
        throw new Error('AI 返回了空的产品选择内容。');
    }
    console.log('[流程步骤] 5/7: 成功解析 AI 产品选择结果。选择的产品数量:', parsedSelection.selectedItems.length);

    const allProducts: Product[] = [...products, ...customProductsForEnrichment];
    const productMap = new Map(allProducts.map(p => [p.id, p]));

    const totalCost = parsedSelection.selectedItems.reduce((acc, item) => {
        const product = productMap.get(item.product_id);
        return acc + (product ? product.price * item.quantity : 0);
    }, 0);

    const reportResult = await generateAnalysisReport({
        budgetLevel: input.budgetLevel,
        selectedItems: parsedSelection.selectedItems,
        totalPrice: totalCost,
        area: input.area,
        layout: input.layout,
        customNeeds: input.customNeeds || "无",
    });
    
    const analysisReport = reportResult.analysisReport;

    const enrichedItems = parsedSelection.selectedItems.map(item => {
        const product = productMap.get(item.product_id);
        if (!product) return null;
        return { ...item, ...product };
    }).filter((item): item is EnrichedItem => item !== null);

    const finalProposal: Proposal = {
        analysisReport: analysisReport,
        enrichedItems: enrichedItems,
    };
    
    console.log(`[流程步骤] 7/7: 智能家居方案生成完毕。报告长度: ${finalProposal.analysisReport.length}, 产品数量: ${finalProposal.enrichedItems.length}`);
    return finalProposal;
  }
);


export async function generateSmartHomeProducts(input: GenerateSmartHomeProductsInput): Promise<Proposal> {
    return await generateSmartHomeProductsFlow(input);
}
