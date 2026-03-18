import type { Meta, StoryObj } from '@storybook/react';

import { Label, Input } from '../index';

const meta = {
  title: 'Primitives/Label',
  component: Label,
  tags: ['autodocs'],
  args: {
    children: 'Form Label',
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInput: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '320px' }}>
      <Label htmlFor="username">Username</Label>
      <Input id="username" placeholder="Enter username" />
    </div>
  ),
};

export const DisabledPeer: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '320px' }}>
      <Label htmlFor="disabled-field">Disabled field</Label>
      <Input id="disabled-field" disabled placeholder="Cannot edit" className="peer" />
    </div>
  ),
};
