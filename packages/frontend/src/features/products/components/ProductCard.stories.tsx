import type { Meta, StoryObj } from '@storybook/react';
import type { TrackedProductResponse } from '@findog/api-client/endpoints/index.schemas';

import { ProductCard } from './ProductCard';

const BASE_PRODUCT: TrackedProductResponse = {
  id: 'prod-001',
  user_id: 'user-001',
  source_url: 'https://example.com/products/wireless-headphones',
  source_platform: 'Amazon',
  source_title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
  source_image_url: 'https://picsum.photos/seed/headphones/160/160',
  source_price_amount: '349.99',
  source_currency: 'USD',
  normalized_query: 'sony wh-1000xm5',
  product_fingerprint: 'fp-sony-xm5',
  monitoring_status: 'active',
  restock_alert_enabled: true,
  lowest_price_tracking_enabled: true,
  last_checked_at: '2026-03-15T10:30:00Z',
  created_at: '2026-03-10T08:00:00Z',
  updated_at: '2026-03-15T10:30:00Z',
};

const meta = {
  title: 'Features/Products/ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
  args: {
    product: BASE_PRODUCT,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '480px', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Paused: Story = {
  args: {
    product: { ...BASE_PRODUCT, monitoring_status: 'paused' },
  },
};

export const Archived: Story = {
  args: {
    product: { ...BASE_PRODUCT, monitoring_status: 'archived' },
  },
};

export const WithoutImage: Story = {
  args: {
    product: { ...BASE_PRODUCT, source_image_url: null },
  },
};

export const NoPriceAvailable: Story = {
  args: {
    product: {
      ...BASE_PRODUCT,
      source_price_amount: null,
      source_currency: null,
    },
  },
};

export const LongTitle: Story = {
  args: {
    product: {
      ...BASE_PRODUCT,
      source_title:
        'Apple MacBook Pro 16-inch M3 Max Chip 48GB Memory 1TB SSD Space Black - Latest Model 2025 Edition with Extended AppleCare+',
    },
  },
};

export const Interactive: Story = {
  args: {
    product: BASE_PRODUCT,
    onClick: undefined,
  },
  argTypes: {
    onClick: { action: 'card-clicked' },
  },
};

export const KoreanWon: Story = {
  args: {
    product: {
      ...BASE_PRODUCT,
      source_price_amount: '459000',
      source_currency: 'KRW',
      source_platform: 'Coupang',
    },
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <ProductCard product={{ ...BASE_PRODUCT, monitoring_status: 'active' }} />
      <ProductCard product={{ ...BASE_PRODUCT, monitoring_status: 'paused' }} />
      <ProductCard product={{ ...BASE_PRODUCT, monitoring_status: 'archived' }} />
    </div>
  ),
};
