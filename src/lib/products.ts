export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  budget_level: 'economy' | 'premium' | 'luxury';
  ecosystem: string[];
  description: string;
  imageUrl: string;
};

export type SelectedItem = {
    product_id: string;
    quantity: number;
    room: string;
    reason: string;
};

export type EnrichedItem = SelectedItem & Product;

export type Proposal = {
    analysisReport: string;
    enrichedItems: EnrichedItem[];
}
