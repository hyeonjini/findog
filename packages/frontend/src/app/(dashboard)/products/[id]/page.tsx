import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import type { TrackedProductResponse } from '@findog/api-client/endpoints/index.schemas';

import { serverApiFetch, ServerApiError } from '@/lib/api/server';

export const dynamic = 'force-dynamic';
import { ProductDetail } from '@/features/products/components/ProductDetail';

async function getTrackedProduct(id: string) {
  try {
    return await serverApiFetch<TrackedProductResponse>(
      `/api/tracked-products/${id}`,
    );
  } catch (error) {
    if (error instanceof ServerApiError) {
      if (error.status === 404) {
        notFound();
      }
      if (error.status === 401) {
        redirect('/login');
      }
    }
    throw error;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getTrackedProduct(id);

  return (
    <div data-testid="product-detail-page">
      <nav className="mb-[--space-4]">
        <Link
          href="/products"
          className="inline-flex items-center gap-[--space-1] text-[length:--font-size-sm] font-[number:--font-weight-medium] text-[--color-brand-500] hover:text-[--color-brand-600]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to products
        </Link>
      </nav>

      <ProductDetail product={product} />
    </div>
  );
}
