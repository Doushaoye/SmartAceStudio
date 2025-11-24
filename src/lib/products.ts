import productsData from '@/data/products.json';
import type { GenerateSmartHomeProductsOutput } from '@/ai/flows/generate-smart-home-products';

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  budget_level: 'economy' | 'premium' | 'luxury';
  ecosystem: string[];
  description: string;
  image_id: string;
  imageUrl: string;
  imageHint: string;
};

export const products: Product[] = productsData;

export type SelectedItem = NonNullable<GenerateSmartHomeProductsOutput['selectedItems']>[0];

export type EnrichedItem = SelectedItem & Product;

export type Proposal = {
    analysisReport: string;
    enrichedItems: EnrichedItem[];
}
