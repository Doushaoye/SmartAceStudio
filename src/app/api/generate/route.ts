// app/api/generate/route.ts
import { generateSmartHomeProductsStream } from '@/ai/flows/generate-smart-home-products';
import { type NextRequest } from 'next/server';
import type { Product } from '@/lib/products';
import productsData from '@/data/products.json';
import Papa from 'papaparse';

const products: Product[] = productsData as Product[];

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

export const runtime = 'edge'; // Use edge runtime for streaming

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // --- Start: Duplicated logic from actions.ts ---
    const defaultSimplifiedProducts = products.map(p => toChineseKeys(p, false));
    let combinedProducts = [...defaultSimplifiedProducts];
    
    const customProductsCsv = formData.get('productsCsv') as string;

    if (customProductsCsv) {
      try {
        const parseResult = Papa.parse(customProductsCsv, {
          header: true,
          skipEmptyLines: true,
        });

        if (parseResult.errors.length > 0) {
          throw new Error(`CSV parsing error: ${parseResult.errors.map(e => e.message).join(', ')}`);
        }
        
        const customProducts: any[] = parseResult.data;
        const simplifiedCustomProducts = customProducts.map(p => toChineseKeys({
          id: `USER-${crypto.randomUUID()}`,
          name: p['产品名称'],
          brand: p['品牌'],
          category: p['品类'],
          price: Number(p['价格']),
          ecosystem: p['生态平台(用;分隔)']?.split(';').map((e: string) => e.trim()).filter(Boolean) || [],
          description: p['产品描述'],
        }, true));
        
        combinedProducts = [...simplifiedCustomProducts, ...defaultSimplifiedProducts];

      } catch (e) {
        console.error("Failed to parse or process custom products CSV", e);
      }
    }
    const productsJson = JSON.stringify(combinedProducts);
    // --- End: Duplicated logic ---
    
    const area = Number(formData.get('area'));
    const layout = formData.get('layout') as '2r1l1b' | '3r2l1b' | '3r2l2b' | '4r2l2b' | '4r2l3b';
    const budgetLevel = formData.get('budgetLevel') as 'economy' | 'premium' | 'luxury';
    const customNeeds = formData.get('customNeeds') as string;
    const lightingStyle = formData.get('lightingStyle') as string;
    const ecosystem = formData.get('ecosystem') as string;
    const householdProfile = formData.getAll('householdProfile[]') as string[];
    const focusAreas = formData.getAll('focusAreas[]') as string[];
    const floorPlanFile = formData.get('floorPlan');

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
      productsJson,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[Generate API Error]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
