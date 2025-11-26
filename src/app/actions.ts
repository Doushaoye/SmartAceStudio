'use server';

import type { Proposal } from '@/lib/products';
import { generateSmartHomeProducts } from '@/ai/flows/generate-smart-home-products';

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
    
    return { proposal: result };

  } catch (error) {
    console.error('Error in generateProposalAction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { error: errorMessage };
  }
}
