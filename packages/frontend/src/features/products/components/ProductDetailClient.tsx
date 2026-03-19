'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useRefreshTrackedProductApiTrackedProductsTrackedProductIdRefreshPost,
  useRestoreTrackedProductApiTrackedProductsTrackedProductIdRestorePost,
} from '@findog/api-client/endpoints';
import { Button, useToast } from '@findog/design-system';
import { parseApiError } from '@/lib/utils/parse-api-error';

import type { PriceHistoryResponse } from '../types/price-history';
import { ArchiveConfirmDialog } from './ArchiveConfirmDialog';
import { PriceHistorySection } from './PriceHistorySection';
import { ProductDetail, type ProductDetailProps } from './ProductDetail';
import { ProductUpdateModal } from './ProductUpdateModal';

type ProductDetailClientProps = {
  product: ProductDetailProps['product'];
  priceHistory: PriceHistoryResponse[];
};

export function ProductDetailClient({ product, priceHistory }: ProductDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const restoreMutation =
    useRestoreTrackedProductApiTrackedProductsTrackedProductIdRestorePost({
      mutation: {
        onSuccess: () => {
          toast({ title: 'Product restored', variant: 'success' });
          router.refresh();
        },
        onError: (error) => {
          toast({ title: parseApiError(error), variant: 'destructive' });
        },
      },
    });

  const refreshMutation =
    useRefreshTrackedProductApiTrackedProductsTrackedProductIdRefreshPost({
      mutation: {
        onSuccess: () => {
          toast({ title: 'Refresh requested', variant: 'default' });
          router.refresh();
        },
        onError: (error) => {
          toast({ title: parseApiError(error), variant: 'destructive' });
        },
      },
    });

  const isArchived = product.monitoring_status === 'archived';

  return (
    <>
      <ProductDetail product={product} />

      <div className="mt-[--space-6] flex flex-wrap gap-[--space-2]">
        <Button onClick={() => setEditOpen(true)}>Edit</Button>

        {!isArchived && (
          <Button variant="ghost" onClick={() => setArchiveOpen(true)}>
            Archive
          </Button>
        )}

        {isArchived && (
          <Button
            onClick={() =>
              restoreMutation.mutate({ trackedProductId: product.id })
            }
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={() => refreshMutation.mutate({ trackedProductId: product.id })}
          disabled={refreshMutation.isPending}
        >
          {refreshMutation.isPending ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <PriceHistorySection data={priceHistory} />

      <ProductUpdateModal
        open={editOpen}
        onOpenChange={setEditOpen}
        product={product}
      />

      <ArchiveConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        productTitle={product.source_title}
        productId={product.id}
        onArchived={() => setArchiveOpen(false)}
      />
    </>
  );
}
