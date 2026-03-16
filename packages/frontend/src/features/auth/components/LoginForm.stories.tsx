import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LoginForm } from './LoginForm';

function createDecorator() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function QueryDecorator(Story: React.ComponentType) {
    return (
      <QueryClientProvider client={client}>
        <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
          <Story />
        </div>
      </QueryClientProvider>
    );
  };
}

const meta = {
  title: 'Features/Auth/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
  decorators: [createDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFilledFields: Story = {
  play: async ({ canvasElement }) => {
    const email = canvasElement.querySelector<HTMLInputElement>('[data-testid="login-email"]');
    const password = canvasElement.querySelector<HTMLInputElement>('[data-testid="login-password"]');

    if (email) {
      setNativeValue(email, 'user@example.com');
    }
    if (password) {
      setNativeValue(password, 'securepassword123');
    }
  },
};

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
