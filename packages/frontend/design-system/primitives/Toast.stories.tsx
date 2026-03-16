import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  Button,
} from '../index';

/**
 * Toast requires a Provider + Viewport wrapper to function.
 * These stories demonstrate the visual appearance of each variant.
 */
const meta = {
  title: 'Primitives/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success'],
    },
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
        <ToastViewport />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Toast open variant="default">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <ToastTitle>Notification</ToastTitle>
        <ToastDescription>Something happened successfully.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Toast open variant="destructive">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <ToastTitle>Error</ToastTitle>
        <ToastDescription>Something went wrong. Please try again.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
};

export const Success: Story = {
  render: () => (
    <Toast open variant="success">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <ToastTitle>Success</ToastTitle>
        <ToastDescription>Product saved to your watchlist.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Toast open variant="default">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <ToastTitle>Product Removed</ToastTitle>
        <ToastDescription>The product was removed from tracking.</ToastDescription>
      </div>
      <ToastAction altText="Undo removal">Undo</ToastAction>
      <ToastClose />
    </Toast>
  ),
};

const InteractiveDemo = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Show Toast
      </Button>
      <Toast open={open} onOpenChange={setOpen} variant="default">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <ToastTitle>Triggered Toast</ToastTitle>
          <ToastDescription>This toast was triggered by a button click.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
    </>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
