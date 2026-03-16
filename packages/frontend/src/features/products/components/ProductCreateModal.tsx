'use client';

import { useState, type ChangeEvent, type ComponentProps } from 'react';
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
import { useCreateTrackedProductApiTrackedProductsPost } from '@findog/api-client/endpoints';

import {
  createProductSchema,
  type CreateProductInput,
} from '../schemas/create-product.schema';
import { parseApiError } from '@/lib/utils/parse-api-error';

type ProductCreateModalProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
};

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0];

const initialFormData: CreateProductInput = {
  source_url: '',
  source_title: '',
};

export function ProductCreateModal({
  open,
  onOpenChange,
}: ProductCreateModalProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateProductInput>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateProductInput, string>>
  >({});

  const mutation = useCreateTrackedProductApiTrackedProductsPost({
    mutation: {
      onSuccess: () => {
        toast({ title: 'Product added', variant: 'success' });
        router.refresh();
        handleOpenChange(false);
      },
    },
  });

  const apiError = mutation.error ? parseApiError(mutation.error) : null;

  function resetForm() {
    setFormData(initialFormData);
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

    const result = createProductSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof CreateProductInput, string>> = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CreateProductInput;
        if (!errors[field]) errors[field] = issue.message;
      }

      setFieldErrors(errors);
      return;
    }

    mutation.mutate({ data: result.data });
  }

  function handleChange(field: keyof CreateProductInput) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));

      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          data-testid="product-create-form"
          noValidate
          className="mt-[--space-4] flex flex-col gap-[--space-4]"
        >
          {apiError && (
            <div
              data-testid="product-create-api-error"
              role="alert"
              className="rounded-md border border-[--color-error-500] bg-[--color-error-500]/10 px-[--space-3] py-[--space-2] text-[length:--font-size-sm] text-[--color-error-500]"
            >
              {apiError}
            </div>
          )}

          <div className="flex flex-col gap-[--space-1]">
            <Label htmlFor="product-create-source-url">Product URL</Label>
            <Input
              id="product-create-source-url"
              data-testid="product-create-source-url"
              type="url"
              placeholder="https://example.com/product"
              value={formData.source_url}
              onChange={handleChange('source_url')}
              aria-invalid={!!fieldErrors.source_url}
              aria-describedby={
                fieldErrors.source_url
                  ? 'product-create-source-url-error'
                  : undefined
              }
              className={
                fieldErrors.source_url
                  ? 'border-[--color-error-500] focus-visible:ring-[--color-error-500]'
                  : ''
              }
            />
            {fieldErrors.source_url && (
              <p
                id="product-create-source-url-error"
                data-testid="product-create-source-url-error"
                className="text-[length:--font-size-sm] text-[--color-error-500]"
              >
                {fieldErrors.source_url}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-[--space-1]">
            <Label htmlFor="product-create-source-title">Product title</Label>
            <Input
              id="product-create-source-title"
              data-testid="product-create-source-title"
              type="text"
              placeholder="Acme Trail Running Shoes"
              value={formData.source_title}
              onChange={handleChange('source_title')}
              aria-invalid={!!fieldErrors.source_title}
              aria-describedby={
                fieldErrors.source_title
                  ? 'product-create-source-title-error'
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
                id="product-create-source-title-error"
                data-testid="product-create-source-title-error"
                className="text-[length:--font-size-sm] text-[--color-error-500]"
              >
                {fieldErrors.source_title}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              data-testid="product-create-submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Adding...' : 'Add product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
