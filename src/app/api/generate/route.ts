'use server';

import { generateSmartHomeProductsStream } from '@/ai/flows/generate-smart-home-products';

export const dynamic = 'force-dynamic'; // defaults to auto

function toChineseKeys(product: any, isCustom: boolean) {
  const result: any = {
    'ID': product.id,
    '名称': product.name,
    '品牌': product.brand,
    '品类': product.category,
    '价格': product.price,
    '生态': product.ecosystem.join(';'),
    '描述': product.description,
    'budget_level': product.budget_level,
  };
  if (isCustom) {
    result['来源'] = '用户自定义';
  }
  return result;
}


export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const area = Number(formData.get('area'));
    const layout = formData.get('layout') as '2r1l1b' | '3r2l1b' | '3r2l2b' | '4r2l2b' | '4r2l3b';
    const budgetLevel = formData.get('budgetLevel') as 'economy' | 'premium' | 'luxury';
    const customNeeds = formData.get('customNeeds') as string;
    const lightingStyle = formData.get('lightingStyle') as string;
    const ecosystem = formData.get('ecosystem') as string;
    const householdProfile = formData.getAll('householdProfile[]') as string[];
    const focusAreas = formData.getAll('focusAreas[]') as string[];
    const floorPlanFile = formData.get('floorPlan');
    const customProductsCsv = formData.get('productsCsv') as string;

    let floorPlanDataUri: string | undefined = undefined;
    if (floorPlanFile instanceof File && floorPlanFile.size > 0) {
      const buffer = await floorPlanFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      floorPlanDataUri = `data:${floorPlanFile.type};base64,${base64}`;
    }

    const stream = await generateSmartHomeProductsStream({
      area,
      layout,
      budgetLevel,
      householdProfile,
      focusAreas,
      lightingStyle,
      ecosystem,
      customNeeds,
      floorPlanDataUri,
      productsCsv: customProductsCsv,
    });
    
    return new Response(stream);

  } catch (error) {
    console.error('Error in generate API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}