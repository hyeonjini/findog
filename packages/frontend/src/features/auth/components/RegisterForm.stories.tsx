import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { RegisterForm } from './RegisterForm';

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
  title: 'Features/Auth/RegisterForm',
  component: RegisterForm,
  tags: ['autodocs'],
  decorators: [createDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof RegisterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFilledFields: Story = {
  play: async ({ canvasElement }) => {
    const email = canvasElement.querySelector<HTMLInputElement>('[data-testid="register-email"]');
    const password = canvasElement.querySelector<HTMLInputElement>('[data-testid="register-password"]');

    if (email) {
      setNativeValue(email, 'newuser@example.com');
    }
    if (password) {
      setNativeValue(password, 'strongpassword1!');
    }
  },
};

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
