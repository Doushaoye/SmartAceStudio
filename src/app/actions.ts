'use server';

import type { Proposal, Product, EnrichedItem } from '@/lib/products';
import { generateSmartHomeProducts } from '@/ai/flows/generate-smart-home-products';
import { products } from '@/lib/products-data';
import Papa from 'papaparse';
import crypto from 'crypto';

export async function generateProposalAction(
  formData: FormData
): Promise<{ proposal?: Proposal; error?: string }> {
  try {
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
      productsCsv: customProductsCsv,
    });

    const customProductsForEnrichment: Product[] = [];
    if (customProductsCsv) {
        const parseResult = Papa.parse(customProductsCsv, {
            header: true,
            skipEmptyLines: true,
        });
        const customProductsData: any[] = parseResult.data;
        customProductsData.forEach((row: any) => {
            const customProduct: Product = {
                id: `USER-${crypto.randomUUID()}`, // This ID is temporary and local
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
        });
    }

    // It's crucial to use the exact same logic for product enrichment as used inside the flow
    // We will rely on the `enrichedItems` returned from the flow itself.
    const finalProposal: Proposal = {
      analysisReport: result.analysisReport,
      enrichedItems: result.enrichedItems,
    };

    return { proposal: finalProposal };

  } catch (error) {
    console.error('Error in generateProposalAction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { error: errorMessage };
  }
}
