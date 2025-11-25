'use server';

import type { Proposal } from '@/lib/products';
import type { Product } from '@/lib/products';
import { products } from '@/lib/products-data';
import Papa from 'papaparse';

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

export async function enrichProposal(
  proposal: Omit<Proposal, 'enrichedItems'> & { selectedItems: Proposal['enrichedItems'] }
): Promise<{ proposal?: Proposal; error?: string }> {
  try {
    const allProductsForEnrichment: Product[] = [...products];

    const productMap = new Map<string, Product>(allProductsForEnrichment.map((p) => [p.id, p]));

    const enrichedItems = proposal.selectedItems.map(item => {
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
      analysisReport: proposal.analysisReport,
      enrichedItems: enrichedItems,
    };

    return { proposal: finalProposal };
  } catch (error) {
    console.error('Error in enrichProposal:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred during proposal enrichment.';
    return { error: errorMessage };
  }
}
