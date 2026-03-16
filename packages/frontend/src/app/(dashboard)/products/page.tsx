import { redirect } from 'next/navigation';

import type { TrackedProductListResponse } from '@findog/api-client/endpoints/index.schemas';

import { ProductListClient } from '@/features/products/components/ProductListClient';
import { serverApiFetch, ServerApiError } from '@/lib/api/server';

export const dynamic = 'force-dynamic';

async function getTrackedProducts(): Promise<TrackedProductListResponse> {
  try {
    return await serverApiFetch<TrackedProductListResponse>('/api/tracked-products');
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      redirect('/login');
    }
    throw error;
  }
}

export default async function ProductsPage() {
  const data = await getTrackedProducts();

  return (
    <div data-testid="products-page">
      <ProductListClient items={data.items} />
    </div>
  );
}
