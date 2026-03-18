import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders a semantic button with primary defaults', () => {
    render(<Button>Track price</Button>);

    const button = screen.getByRole('button', { name: 'Track price' });

    expect(button).toBeEnabled();
    expect(button).toHaveClass(
      'bg-[var(--color-brand-500)]',
      'h-10',
      'text-base',
    );
  });

  it('applies variant and size classes when provided', () => {
    render(
      <Button size="sm" variant="ghost">
        Compare prices
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Compare prices' });

    expect(button).toHaveClass('bg-transparent', 'h-8', 'text-sm');
  });
});
