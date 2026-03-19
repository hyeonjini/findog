export interface PriceHistoryResponse {
  id: string;
  tracked_product_id: string;
  platform: string;
  price_amount: string;
  currency: string;
  product_url: string | null;
  in_stock: boolean;
  checked_at: string;
  created_at: string;
}

export interface PriceHistoryListResponse {
  items: PriceHistoryResponse[];
  total: number;
}
