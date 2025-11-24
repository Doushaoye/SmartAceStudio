'use server';

import { generateSmartHomeProducts } from '@/ai/flows/generate-smart-home-products';
import { products, type Product } from '@/lib/products';
import type { Proposal } from '@/lib/products';

export async function generateProposalAction(
  formData: FormData
): Promise<{ proposal?: Proposal; error?: string }> {
  try {
    const productsJson = JSON.stringify(products);

    const area = Number(formData.get('area'));
    const layout = formData.get('layout') as 'Studio' | '1B1B' | '2B1B' | '3B2B' | 'Villa';
    const budgetLevel = formData.get('budgetLevel') as 'economy' | 'premium' | 'luxury';
    const customNeeds = formData.get('customNeeds') as string;
    const floorPlanFile = formData.get('floorPlan') as File | null;

    let floorPlanDataUri: string | undefined = undefined;
    if (floorPlanFile && floorPlanFile.size > 0) {
      const buffer = await floorPlanFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      floorPlanDataUri = `data:${floorPlanFile.type};base64,${base64}`;
    }

    const aiResult = await generateSmartHomeProducts({
      area,
      layout,
      budgetLevel,
      customNeeds,
      floorPlanDataUri,
      productsJson,
    });

    if (!aiResult || !aiResult.selectedItems || !aiResult.analysisReport) {
      throw new Error('AI failed to generate a valid proposal.');
    }
    
    const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));

    const enrichedItems = aiResult.selectedItems.map(item => {
      const product = productMap.get(item.product_id);
      if (!product) {
        // AI might hallucinate a product, we'll just skip it
        console.warn(`Product with ID ${item.product_id} not found.`);
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
