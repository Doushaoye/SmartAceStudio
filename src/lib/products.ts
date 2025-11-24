import productsData from '@/data/products.json';
import type { GenerateSmartHomeProductsOutput } from '@/ai/flows/generate-smart-home-products';

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  budget_level: 'economy' | 'premium' | 'luxury';
  description: string;
  image_id: string;
};

export const products: Product[] = productsData.map(p => ({...p, name: p.name || p['nameL'] || p['nameD']}));

export type SelectedItem = NonNullable<GenerateSmartHomeProductsOutput['selectedItems']>[0];

export type EnrichedItem = SelectedItem & Product;

export type Proposal = {
    analysisReport: string;
    enrichedItems: EnrichedItem[];
}
