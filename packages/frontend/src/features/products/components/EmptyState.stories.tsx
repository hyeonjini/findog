import type { Meta, StoryObj } from '@storybook/react';

import { EmptyState } from './EmptyState';

const meta = {
  title: 'Features/Products/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCustomClass: Story = {
  args: {
    className: 'bg-[--color-surface-hover] rounded-lg',
  },
};
