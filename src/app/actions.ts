'use server';

import { generateSmartHomeProducts } from '@/ai/flows/generate-smart-home-products';
import { products, type Product } from '@/lib/products';
import type { Proposal } from '@/lib/products';

export async function generateProposalAction(
  formData: FormData
): Promise<{ proposal?: Proposal; error?: string }> {
  try {
    const defaultSimplifiedProducts = products.map(({ id, name, category, price, budget_level, brand, description, ecosystem }) => ({
      'id': id,
      '名称': name,
      '品牌': brand,
      '品类': category,
      '价格': price,
      '预算等级': budget_level,
      '生态': ecosystem,
      '描述': description
    }));

    let combinedProducts = [...defaultSimplifiedProducts];

    const customProductsJson = formData.get('productsJson') as string;
    if (customProductsJson) {
      try {
        const customProducts = JSON.parse(customProductsJson);
        const simplifiedCustomProducts = customProducts.map((p: any) => ({
          'id': p.id,
          '名称': p.name,
          '品牌': p.brand,
          '品类': p.category,
          '价格': p.price,
          '预算等级': p.budget_level,
          '生态': p.ecosystem,
          '描述': p.description,
          '来源': '用户自定义' // Add a tag for custom products
        }));
        combinedProducts = [...simplifiedCustomProducts, ...defaultSimplifiedProducts];
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
    
    // The product map should be a combination of default and custom products
    const allProducts = [...products, ...(customProductsJson ? JSON.parse(customProductsJson) : [])];
    const productMap = new Map<string, Product>(allProducts.map((p) => [p.id, p]));

    const enrichedItems = aiResult.selectedItems.map(item => {
      const product = productMap.get(item.product_id);
      if (!product) {
        // AI might hallucinate a product, we'll just skip it
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
