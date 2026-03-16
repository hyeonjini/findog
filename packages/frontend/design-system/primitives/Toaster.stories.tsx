import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from './Toaster';
import { useToast } from '../utils/use-toast';
import { Button } from './Button';

const meta = {
  title: 'Design System/Toaster',
  component: Toaster,
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

function ToasterDemo() {
  const { toast } = useToast();
  return (
    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', width: '200px' }}>
      <Button
        variant="primary"
        onClick={() => toast({ title: 'Success!', description: 'Product added.', variant: 'success' })}
      >
        Show Success Toast
      </Button>
      <Button
        variant="destructive"
        onClick={() => toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })}
      >
        Show Error Toast
      </Button>
      <Button
        variant="ghost"
        onClick={() => toast({ title: 'Info', description: 'Note this.', variant: 'default' })}
      >
        Show Default Toast
      </Button>
      <Toaster />
    </div>
  );
}

export const Default: Story = {
  render: () => <ToasterDemo />,
};
