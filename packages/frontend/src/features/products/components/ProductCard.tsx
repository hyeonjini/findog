'use client';

import { useState } from 'react';
import type { TrackedProductResponse } from '@findog/api-client/endpoints/index.schemas';
import { Card, CardContent } from '@findog/design-system';
import { cn } from '@findog/design-system/utils/cn';
import { formatPrice } from '../utils/format-price';

const STATUS_STYLES: Record<
  string,
  { dot: string; label: string; surface: string; text: string }
> = {
  active: {
    dot: 'bg-[--color-success-500]',
    label: 'Active',
    surface: 'bg-[--color-surface-success]',
    text: 'text-[--color-success-500]',
  },
  paused: {
    dot: 'bg-[--color-warning-500]',
    label: 'Paused',
    surface: 'bg-[--color-surface-warning]',
    text: 'text-[--color-warning-500]',
  },
  archived: {
    dot: 'bg-[--color-text-muted]',
    label: 'Archived',
    surface: 'bg-[--color-surface-hover]',
    text: 'text-[--color-text-muted]',
  },
};

const FALLBACK_STATUS = {
  dot: 'bg-[--color-text-muted]',
  label: '',
  surface: 'bg-[--color-surface-hover]',
  text: 'text-[--color-text-muted]',
};

export interface ProductCardProps {
  product: TrackedProductResponse;
  onClick?: () => void;
  className?: string;
}

export function ProductCard({ product, onClick, className }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const status = STATUS_STYLES[product.monitoring_status] ?? {
    ...FALLBACK_STATUS,
    label: product.monitoring_status,
  };
  const price = formatPrice(
    product.source_price_amount,
    product.source_currency,
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      data-testid="product-card"
      className={cn(
        'transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <CardContent className="flex gap-[--space-3] p-[--space-3]">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[--color-surface-hover]">
          {product.source_image_url && !imgError ? (
            <img
              src={product.source_image_url}
              alt={product.source_title}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-[--color-text-muted]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h3 className="truncate text-[length:--font-size-base] font-[number:--font-weight-bold] leading-[--line-height-normal] text-[--color-text-primary]">
              {product.source_title}
            </h3>
            {product.source_platform && (
              <p className="mt-[--space-1] truncate text-[length:--font-size-sm] text-[--color-text-muted]">
                {product.source_platform}
              </p>
            )}
          </div>

          <div className="mt-[--space-2] flex items-center justify-between gap-[--space-2]">
            <span className="text-[length:--font-size-base] font-[number:--font-weight-bold] text-[--color-text-primary]">
              {price}
            </span>

            <span
              className={cn(
                'inline-flex items-center gap-[--space-1] rounded-full px-[--space-2] py-0.5 text-[length:--font-size-sm]',
                status.surface,
                status.text,
              )}
            >
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  status.dot,
                )}
              />
              {status.label}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
