'use client';

import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  useToast,
} from '@findog/design-system';
import { useArchiveTrackedProductApiTrackedProductsTrackedProductIdArchivePost } from '@findog/api-client/endpoints';
import { parseApiError } from '@/lib/utils/parse-api-error';

type ArchiveConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productTitle: string;
  productId: string;
  onArchived?: () => void;
};

export function ArchiveConfirmDialog({
  open,
  onOpenChange,
  productTitle,
  productId,
  onArchived,
}: ArchiveConfirmDialogProps) {
  const router = useRouter();
  const { toast } = useToast();

  const mutation = useArchiveTrackedProductApiTrackedProductsTrackedProductIdArchivePost({
    mutation: {
      onSuccess: () => {
        toast({ title: 'Product archived', variant: 'default' });
        router.refresh();
        onOpenChange(false);
        onArchived?.();
      },
      onError: (error) => {
        toast({ title: parseApiError(error), variant: 'destructive' });
      },
    },
  });

  function handleArchive() {
    mutation.mutate({ trackedProductId: productId });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive product?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive &ldquo;{productTitle}&rdquo;? You can restore it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={mutation.isPending}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {mutation.isPending ? 'Archiving...' : 'Archive'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
