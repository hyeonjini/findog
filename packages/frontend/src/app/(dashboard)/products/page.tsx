import Link from 'next/link';

import type { TrackedProductListResponse } from '@findog/api-client/endpoints/index.schemas';

import { serverApiFetch, ServerApiError } from '@/lib/api/server';

export const dynamic = 'force-dynamic';
import { ProductCard } from '@/features/products/components/ProductCard';
import { EmptyState } from '@/features/products/components/EmptyState';

async function getTrackedProducts(): Promise<TrackedProductListResponse> {
  try {
    return await serverApiFetch<TrackedProductListResponse>('/api/tracked-products');
  } catch (error) {
    // When SSR has no auth cookie/header (tokens are in client localStorage),
    // the API returns 401. Return empty list so the client-side AuthGuard
    // can handle the redirect if the user is truly unauthenticated.
    if (error instanceof ServerApiError && error.status === 401) {
      return { items: [] };
    }
    throw error;
  }
}

export default async function ProductsPage() {
  const data = await getTrackedProducts();

  if (!data.items.length) {
    return (
      <div data-testid="products-page">
        <h1 className="mb-[--space-6] text-[length:--font-size-lg] font-[number:--font-weight-bold] text-[--color-text-primary]">
          Tracked Products
        </h1>
        <EmptyState />
      </div>
    );
  }

  return (
    <div data-testid="products-page">
      <h1 className="mb-[--space-6] text-[length:--font-size-lg] font-[number:--font-weight-bold] text-[--color-text-primary]">
        Tracked Products
      </h1>

      <div className="grid gap-[--space-3] sm:grid-cols-2">
        {data.items.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-500]"
          >
            <ProductCard product={product} />
          </Link>
        ))}
      </div>
    </div>
  );
}
