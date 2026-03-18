import type { Meta, StoryObj } from '@storybook/react';
import type { TrackedProductResponse } from '@findog/api-client/endpoints/index.schemas';

import { ProductDetail } from './ProductDetail';

const FULL_PRODUCT: TrackedProductResponse = {
  id: 'prod-001',
  user_id: 'user-001',
  source_url: 'https://example.com/products/wireless-headphones',
  source_platform: 'Amazon',
  source_title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
  source_image_url: 'https://picsum.photos/seed/headphones-detail/640/360',
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
  title: 'Features/Products/ProductDetail',
  component: ProductDetail,
  tags: ['autodocs'],
  args: {
    product: FULL_PRODUCT,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllAlertsEnabled: Story = {
  args: {
    product: {
      ...FULL_PRODUCT,
      restock_alert_enabled: true,
      lowest_price_tracking_enabled: true,
    },
  },
};

export const AlertsDisabled: Story = {
  args: {
    product: {
      ...FULL_PRODUCT,
      restock_alert_enabled: false,
      lowest_price_tracking_enabled: false,
    },
  },
};

export const WithoutImage: Story = {
  args: {
    product: { ...FULL_PRODUCT, source_image_url: null },
  },
};

export const PausedMonitoring: Story = {
  args: {
    product: { ...FULL_PRODUCT, monitoring_status: 'paused' },
  },
};

export const ArchivedProduct: Story = {
  args: {
    product: { ...FULL_PRODUCT, monitoring_status: 'archived' },
  },
};

export const NeverChecked: Story = {
  args: {
    product: {
      ...FULL_PRODUCT,
      last_checked_at: null,
    },
  },
};

export const KoreanWon: Story = {
  args: {
    product: {
      ...FULL_PRODUCT,
      source_price_amount: '459000',
      source_currency: 'KRW',
      source_platform: 'Coupang',
    },
  },
};

export const NoPriceAvailable: Story = {
  args: {
    product: {
      ...FULL_PRODUCT,
      source_price_amount: null,
      source_currency: null,
    },
  },
};
