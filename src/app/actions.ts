'use server';

import type { Proposal, Product } from '@/lib/products';
import { generateSmartHomeProducts } from '@/ai/flows/generate-smart-home-products';
import { products } from '@/lib/products-data';
import Papa from 'papaparse';
import crypto from 'crypto';

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

export async function generateProposalAction(
  formData: FormData
): Promise<{ proposal?: Proposal; error?: string }> {
  try {
    const defaultSimplifiedProducts = products.map(p => toChineseKeys(p, false));
    let combinedProducts = [...defaultSimplifiedProducts];

    const customProductsCsv = formData.get('productsCsv') as string;
    const customProductsForEnrichment: Product[] = [];

    if (customProductsCsv) {
      const parseResult = Papa.parse(customProductsCsv, {
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
          budget_level: 'economy',
          imageUrl: `https://picsum.photos/seed/${crypto.randomUUID()}/400/400`,
        };
        customProductsForEnrichment.push(customProduct);
        return toChineseKeys(customProduct, true);
      });
      
      combinedProducts = [...simplifiedCustomProducts, ...defaultSimplifiedProducts];
    }

    const productsJson = JSON.stringify(combinedProducts);

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

    const result = await generateSmartHomeProducts({
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

    const allProductsForEnrichment: Product[] = [...products, ...customProductsForEnrichment];

    const productMap = new Map<string, Product>(allProductsForEnrichment.map((p) => [p.id, p]));

    const enrichedItems = result.selectedItems.map(item => {
      const product = productMap.get(item.product_id);
      if (!product) {
        console.warn(`Product with ID ${item.product_id} not found in available products.`);
        return null;
      }
      return {
        ...item,
        ...product
      };
    }).filter((item): item is import('@/lib/products').EnrichedItem => item !== null);

    const finalProposal: Proposal = {
      analysisReport: result.analysisReport,
      enrichedItems: enrichedItems,
    };

    return { proposal: finalProposal };

  } catch (error) {
    console.error('Error in generateProposalAction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { error: errorMessage };
  }
}
