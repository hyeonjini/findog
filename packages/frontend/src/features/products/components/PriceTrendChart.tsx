'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PriceHistoryResponse } from '../types/price-history';

const PLATFORM_COLORS: Record<string, string> = {
  stub_coupang: '#1A73E8',
  stub_naver: '#03C75A',
  coupang: '#1A73E8',
  naver: '#03C75A',
  gmarket: '#FF6B35',
  elevenst: '#CC0000',
};

const DEFAULT_COLOR = '#3182f6';

const koDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'short',
  day: 'numeric',
});

const koPriceFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

const koCompactFormatter = new Intl.NumberFormat('ko-KR', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

interface ChartRow {
  date: string;
  [platform: string]: number | string;
}

function transformData(items: PriceHistoryResponse[]): {
  rows: ChartRow[];
  platforms: string[];
} {
  const platformSet = new Set<string>();
  const dateMap = new Map<string, Record<string, number>>();

  for (const item of items) {
    const dateKey = new Date(item.checked_at).toISOString().split('T')[0];
    platformSet.add(item.platform);

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {});
    }
    const row = dateMap.get(dateKey)!;
    row[item.platform] = Number(item.price_amount);
  }

  const sortedDates = [...dateMap.keys()].sort();
  const rows: ChartRow[] = sortedDates.map((date) => ({
    date,
    ...dateMap.get(date)!,
  }));

  return { rows, platforms: [...platformSet] };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
  }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length || !label) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-base)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        padding: '10px 14px',
      }}
    >
      <p
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          marginBottom: '6px',
          fontWeight: 'var(--font-weight-medium)',
        }}
      >
        {koDateFormatter.format(new Date(label))}
      </p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: 'var(--font-size-sm)',
            marginBottom: '2px',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {entry.name}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
            }}
          >
            {koPriceFormatter.format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface PriceTrendChartProps {
  data: PriceHistoryResponse[];
  className?: string;
}

export function PriceTrendChart({ data, className }: PriceTrendChartProps) {
  const { rows, platforms } = transformData(data);

  return (
    <div className={className} style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-default)"
            opacity={0.5}
          />

          <XAxis
            dataKey="date"
            tickFormatter={(value: string) =>
              koDateFormatter.format(new Date(value))
            }
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            tickFormatter={(value: number) => koCompactFormatter.format(value)}
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={56}
          />

          <Tooltip content={<ChartTooltip />} />

          {platforms.map((platform) => (
            <Line
              key={platform}
              type="monotone"
              dataKey={platform}
              name={platform}
              stroke={PLATFORM_COLORS[platform] ?? DEFAULT_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
