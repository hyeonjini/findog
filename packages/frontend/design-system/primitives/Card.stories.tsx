import type { Meta, StoryObj } from '@storybook/react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
} from '../index';

const meta = {
  title: 'Primitives/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    asChild: { table: { disable: true } },
  },
  args: {
    variant: 'default',
    padding: 'none',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: '400px' }}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>A short description of this card.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card body content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Outlined: Story = {
  render: () => (
    <Card variant="outlined" style={{ maxWidth: '400px' }}>
      <CardHeader>
        <CardTitle>Outlined Card</CardTitle>
        <CardDescription>No shadow, border only.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Clean, flat appearance.</p>
      </CardContent>
    </Card>
  ),
};

export const Elevated: Story = {
  render: () => (
    <Card variant="elevated" style={{ maxWidth: '400px' }}>
      <CardHeader>
        <CardTitle>Elevated Card</CardTitle>
        <CardDescription>Prominent shadow, no border.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Stands out from the surface.</p>
      </CardContent>
    </Card>
  ),
};

export const WithPadding: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {(['sm', 'md', 'lg'] as const).map((pad) => (
        <Card key={pad} padding={pad} style={{ minWidth: '200px' }}>
          <CardHeader>
            <CardTitle>Padding: {pad}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Content area</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

export const CompleteExample: Story = {
  render: () => (
    <Card variant="default" style={{ maxWidth: '400px' }}>
      <CardHeader>
        <CardTitle>Product Tracker</CardTitle>
        <CardDescription>Track price changes over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>$29.99</p>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Lowest: $24.99</p>
        </div>
      </CardContent>
      <CardFooter style={{ gap: '0.5rem' }}>
        <Button size="sm" variant="primary">View Details</Button>
        <Button size="sm" variant="ghost">Remove</Button>
      </CardFooter>
    </Card>
  ),
};
