'use server';

import { generateSmartHomeProducts } from '@/ai/flows/generate-smart-home-products';
import { type Proposal } from '@/lib/products';
import type { Product } from '@/lib/products';
import productsData from '@/data/products.json';

const products: Product[] = productsData as Product[];

function toChineseKeys(product: any, isCustom: boolean) {
  const result: any = {
    'ID': product.id,
    '名称': product.name,
    '品牌': product.brand,
    '品类': product.category,
    '价格': product.price,
    '预算等级': product.budget_level,
    '生态': product.ecosystem,
    '描述': product.description,
  };
  if (isCustom) {
    result['来源'] = '用户自定义';
  }
  return result;
}


export async function generateProposalAction(
  formData: FormData
): Promise<{ proposal?: Proposal; error?: string }> {
  try {
    const defaultSimplifiedProducts = products.map(p => toChineseKeys(p, false));

    let combinedProducts = [...defaultSimplifiedProducts];
    let allProductsForEnrichment: Product[] = [...products];

    const customProductsJson = formData.get('productsJson') as string;
    if (customProductsJson) {
      try {
        const customProducts: Product[] = JSON.parse(customProductsJson);
        const simplifiedCustomProducts = customProducts.map(p => toChineseKeys(p, true));
        
        combinedProducts = [...simplifiedCustomProducts, ...defaultSimplifiedProducts];
        allProductsForEnrichment = [...customProducts, ...products];

      } catch (e) {
        console.error("Failed to parse or process custom products JSON", e);
        // Continue with default products if custom ones are invalid
      }
    }
    
    const productsJson = JSON.stringify(combinedProducts);


    const area = Number(formData.get('area'));
    const layout = formData.get('layout') as '2r1l1b' | '3r2l1b' | '3r2l2b' | '4r2l2b' | '4r2l3b';
    const budgetLevel = formData.get('budgetLevel') as 'economy' | 'premium' | 'luxury';
    const customNeeds = formData.get('customNeeds') as string;
    const floorPlanFile = formData.get('floorPlan');
    const lightingStyle = formData.get('lightingStyle') as string;
    const ecosystem = formData.get('ecosystem') as string;

    
    const householdProfile = formData.getAll('householdProfile[]') as string[];
    const focusAreas = formData.getAll('focusAreas[]') as string[];
    
    let floorPlanDataUri: string | undefined = undefined;
    if (floorPlanFile instanceof File && floorPlanFile.size > 0) {
      const buffer = await floorPlanFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      floorPlanDataUri = `data:${floorPlanFile.type};base64,${base64}`;
    }

    const aiResult = await generateSmartHomeProducts({
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

    if (!aiResult || !aiResult.selectedItems || !aiResult.analysisReport) {
      throw new Error('AI failed to generate a valid proposal.');
    }
    
    const productMap = new Map<string, Product>(allProductsForEnrichment.map((p) => [p.id, p]));

    const enrichedItems = aiResult.selectedItems.map(item => {
      const product = productMap.get(item.product_id);
      if (!product) {
        console.warn(`Product with ID ${item.product_id} not found in available products.`);
        return null;
      }
      return {
        ...item,
        ...product
      }
    }).filter(Boolean);


    const proposal: Proposal = {
      analysisReport: aiResult.analysisReport,
      // @ts-ignore - filter(Boolean) already ensures there are no nulls
      enrichedItems: enrichedItems,
    };

    return { proposal };
  } catch (error) {
    console.error('Error in generateProposalAction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred during AI proposal generation.';
    return { error: errorMessage };
  }
}
