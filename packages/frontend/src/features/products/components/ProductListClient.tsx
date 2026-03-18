'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TrackedProductResponse } from '@findog/api-client/endpoints/index.schemas';
import { Button } from '@findog/design-system';

import { ArchiveConfirmDialog } from './ArchiveConfirmDialog';
import { EmptyState } from './EmptyState';
import { ProductCard } from './ProductCard';
import { ProductCreateModal } from './ProductCreateModal';
import { ProductUpdateModal } from './ProductUpdateModal';

type ProductListClientProps = {
  items: TrackedProductResponse[];
};

export function ProductListClient({ items }: ProductListClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] =
    useState<TrackedProductResponse | null>(null);
  const [archiveProduct, setArchiveProduct] =
    useState<TrackedProductResponse | null>(null);

  const router = useRouter();
  return (
    <>
      <div className="mb-[--space-6] flex items-center justify-between gap-[--space-3]">
        <h1 className="text-[length:--font-size-lg] font-[number:--font-weight-bold] text-[--color-text-primary]">
          Tracked Products
        </h1>
        <Button onClick={() => setCreateOpen(true)}>Add Product</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState onCreateClick={() => setCreateOpen(true)} />
      ) : (
        <div className="grid gap-[--space-3] sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => router.push(`/products/${product.id}`)}
              onEdit={() => setEditProduct(product)}
              onArchive={() => setArchiveProduct(product)}
            />
          ))}
        </div>
      )}

      <ProductCreateModal open={createOpen} onOpenChange={setCreateOpen} />

      {editProduct && (
        <ProductUpdateModal
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditProduct(null);
            }
          }}
          product={editProduct}
        />
      )}

      {archiveProduct && (
        <ArchiveConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setArchiveProduct(null);
            }
          }}
          productTitle={archiveProduct.source_title}
          productId={archiveProduct.id}
          onArchived={() => setArchiveProduct(null)}
        />
      )}
    </>
  );
}
