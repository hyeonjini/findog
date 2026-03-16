'use client';

import { useState } from 'react';
import type { TrackedProductResponse } from '@findog/api-client/endpoints/index.schemas';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@findog/design-system';
import { cn } from '@findog/design-system/utils/cn';
import { formatPrice, formatDate } from '../utils/format-price';

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

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-[--space-4] py-[--space-2]">
      <dt className="shrink-0 text-[length:--font-size-sm] text-[--color-text-muted]">
        {label}
      </dt>
      <dd className="text-right text-[length:--font-size-sm] font-[number:--font-weight-medium] text-[--color-text-primary]">
        {children}
      </dd>
    </div>
  );
}

function TogglePill({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-[--space-2]">
      <span
        className={cn(
          'inline-block h-2 w-2 rounded-full',
          enabled ? 'bg-[--color-success-500]' : 'bg-[--color-border-default]',
        )}
      />
      <span className="text-[length:--font-size-sm] text-[--color-text-primary]">
        {label}
      </span>
      <span
        className={cn(
          'text-[length:--font-size-sm]',
          enabled ? 'text-[--color-success-500]' : 'text-[--color-text-muted]',
        )}
      >
        {enabled ? 'On' : 'Off'}
      </span>
    </div>
  );
}

export interface ProductDetailProps {
  product: TrackedProductResponse;
  className?: string;
}

export function ProductDetail({ product, className }: ProductDetailProps) {
  const [imgError, setImgError] = useState(false);

  const status = STATUS_STYLES[product.monitoring_status] ?? {
    ...FALLBACK_STATUS,
    label: product.monitoring_status,
  };
  const price = formatPrice(
    product.source_price_amount,
    product.source_currency,
  );

  return (
    <div
      data-testid="product-detail"
      className={cn('space-y-[--space-4]', className)}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[--color-surface-hover]">
        {product.source_image_url && !imgError ? (
          <img
            src={product.source_image_url}
            alt={product.source_title}
            className="h-full w-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-[--color-text-muted]"
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

      <div>
        <div className="flex items-start justify-between gap-[--space-3]">
          <h2 className="text-[length:--font-size-lg] font-[number:--font-weight-bold] leading-[--line-height-normal] text-[--color-text-primary]">
            {product.source_title}
          </h2>
          <span
            className={cn(
              'mt-[--space-1] inline-flex shrink-0 items-center gap-[--space-1] rounded-full px-[--space-2] py-0.5 text-[length:--font-size-sm]',
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

        {product.source_platform && (
          <p className="mt-[--space-1] text-[length:--font-size-sm] text-[--color-text-muted]">
            {product.source_platform}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-[length:--font-size-lg] font-[number:--font-weight-bold] text-[--color-text-primary]">
            {price}
          </span>
          {product.source_currency && (
            <span className="ml-[--space-2] text-[length:--font-size-sm] text-[--color-text-muted]">
              {product.source_currency}
            </span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-[--space-2]">
          <TogglePill
            enabled={product.restock_alert_enabled}
            label="Restock alert"
          />
          <TogglePill
            enabled={product.lowest_price_tracking_enabled}
            label="Price tracking"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-[--color-border-default]">
            <DetailRow label="Source URL">
              <a
                href={product.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--color-brand-500] hover:underline"
              >
                Visit page
              </a>
            </DetailRow>
            <DetailRow label="Added">
              {formatDate(product.created_at)}
            </DetailRow>
            <DetailRow label="Updated">
              {formatDate(product.updated_at)}
            </DetailRow>
            <DetailRow label="Last checked">
              {formatDate(product.last_checked_at)}
            </DetailRow>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
