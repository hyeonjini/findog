import type { Meta, StoryObj } from '@storybook/react';

import { Input, Label } from '../index';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search'],
    },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    placeholder: 'Enter text…',
    type: 'text',
    disabled: false,
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password…',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Cannot edit',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '320px' }}>
      <Label htmlFor="email-input">Email address</Label>
      <Input id="email-input" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const FileInput: Story = {
  args: {
    type: 'file',
  },
};
