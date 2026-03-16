'use client';

import {
  useEffect,
  useState,
  type ChangeEvent,
  type ComponentProps,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  useToast,
} from '@findog/design-system';
import { useUpdateTrackedProductApiTrackedProductsTrackedProductIdPatch } from '@findog/api-client/endpoints';

import {
  updateProductSchema,
  type UpdateProductInput,
} from '../schemas/update-product.schema';
import { parseApiError } from '@/lib/utils/parse-api-error';

type ProductUpdateModalProps = {
  product: {
    id: string;
    source_title: string;
    restock_alert_enabled: boolean;
    lowest_price_tracking_enabled: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0];

function getInitialFormData(
  product: ProductUpdateModalProps['product'],
): UpdateProductInput {
  return {
    source_title: product.source_title,
    restock_alert_enabled: product.restock_alert_enabled,
    lowest_price_tracking_enabled: product.lowest_price_tracking_enabled,
  };
}

function ProductUpdateModalComponent({
  open,
  onOpenChange,
  product,
}: ProductUpdateModalProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<UpdateProductInput>(() =>
    getInitialFormData(product),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof UpdateProductInput, string>>
  >({});

  const mutation = useUpdateTrackedProductApiTrackedProductsTrackedProductIdPatch(
    {
      mutation: {
        onSuccess: () => {
          toast({ title: 'Product updated', variant: 'success' });
          router.refresh();
          handleOpenChange(false);
        },
      },
    },
  );

  const apiError = mutation.error ? parseApiError(mutation.error) : null;

  useEffect(() => {
    setFormData(getInitialFormData(product));
    setFieldErrors({});
    mutation.reset();
  }, [open, product.id]);

  function resetForm() {
    setFormData(getInitialFormData(product));
    setFieldErrors({});
    mutation.reset();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    setFieldErrors({});
    mutation.reset();

    const result = updateProductSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof UpdateProductInput, string>> = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof UpdateProductInput;
        if (!errors[field]) errors[field] = issue.message;
      }

      setFieldErrors(errors);
      return;
    }

    mutation.mutate({ trackedProductId: product.id, data: result.data });
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, source_title: event.target.value }));

    if (fieldErrors.source_title) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.source_title;
        return next;
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Update product</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          data-testid="product-update-form"
          noValidate
          className="mt-[--space-4] flex flex-col gap-[--space-4]"
        >
          {apiError && (
            <div
              data-testid="product-update-api-error"
              role="alert"
              className="rounded-md border border-[--color-error-500] bg-[--color-error-500]/10 px-[--space-3] py-[--space-2] text-[length:--font-size-sm] text-[--color-error-500]"
            >
              {apiError}
            </div>
          )}

          <div className="flex flex-col gap-[--space-1]">
            <Label htmlFor="product-update-source-title">Product title</Label>
            <Input
              id="product-update-source-title"
              data-testid="product-update-source-title"
              type="text"
              placeholder="Acme Trail Running Shoes"
              value={formData.source_title ?? ''}
              onChange={handleTitleChange}
              aria-invalid={!!fieldErrors.source_title}
              aria-describedby={
                fieldErrors.source_title
                  ? 'product-update-source-title-error'
                  : undefined
              }
              className={
                fieldErrors.source_title
                  ? 'border-[--color-error-500] focus-visible:ring-[--color-error-500]'
                  : ''
              }
            />
            {fieldErrors.source_title && (
              <p
                id="product-update-source-title-error"
                data-testid="product-update-source-title-error"
                className="text-[length:--font-size-sm] text-[--color-error-500]"
              >
                {fieldErrors.source_title}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-[--space-3]">
            <Label
              htmlFor="product-update-restock-alert-enabled"
              className="flex items-center gap-[--space-2]"
            >
              <input
                id="product-update-restock-alert-enabled"
                data-testid="product-update-restock-alert-enabled"
                type="checkbox"
                checked={formData.restock_alert_enabled ?? false}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    restock_alert_enabled: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border border-[--color-border-default] accent-[--color-brand-500]"
              />
              Restock alert enabled
            </Label>

            <Label
              htmlFor="product-update-lowest-price-tracking-enabled"
              className="flex items-center gap-[--space-2]"
            >
              <input
                id="product-update-lowest-price-tracking-enabled"
                data-testid="product-update-lowest-price-tracking-enabled"
                type="checkbox"
                checked={formData.lowest_price_tracking_enabled ?? false}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    lowest_price_tracking_enabled: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border border-[--color-border-default] accent-[--color-brand-500]"
              />
              Lowest price tracking enabled
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              data-testid="product-update-submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const ProductUpdateModal = ProductUpdateModalComponent;
