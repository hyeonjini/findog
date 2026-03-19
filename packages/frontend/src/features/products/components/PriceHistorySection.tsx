'use client';

import type { PriceHistoryResponse } from '../types/price-history';
import { PriceTrendChart } from './PriceTrendChart';

interface PriceHistorySectionProps {
  data: PriceHistoryResponse[];
}

export function PriceHistorySection({ data }: PriceHistorySectionProps) {
  if (data.length === 0) {
    return (
      <div
        className="mt-[--space-6]"
        style={{
          backgroundColor: 'var(--color-bg-base)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-brand-50)', fontSize: '1.5rem' }}
          >
            📈
          </div>
          <h3
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: '4px',
            }}
          >
            아직 가격 데이터가 없습니다
          </h3>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              lineHeight: 'var(--line-height-normal)',
              maxWidth: '280px',
            }}
          >
            가격 추적이 활성화되면 여기에 가격 추이가 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-[--space-6]"
      style={{
        backgroundColor: 'var(--color-bg-base)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-default)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex items-center justify-between px-5 pt-5 pb-2"
      >
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
          }}
        >
          가격 추이
        </h2>
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          총 {data.length}건의 가격 기록
        </span>
      </div>

      <PriceTrendChart data={data} className="px-2 pb-4" />
    </div>
  );
}
