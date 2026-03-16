import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ProductCreateModal } from './ProductCreateModal';

const meta = {
  title: 'Features/Products/ProductCreateModal',
  component: ProductCreateModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ProductCreateModal>;

export default meta;
type Story = StoryObj<typeof meta>;

function createDecorator() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function QueryDecorator({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
  decorators: [
    (Story) => {
      const Wrapper = createDecorator();
      return (
        <Wrapper>
          <Story />
        </Wrapper>
      );
    },
  ],
};
