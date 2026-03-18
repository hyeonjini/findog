import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders an accessible textbox with the provided props', () => {
    render(
      <div>
        <label htmlFor="product-name">Product name</label>
        <Input
          disabled
          id="product-name"
          placeholder="Search saved products"
        />
      </div>,
    );

    const input = screen.getByRole('textbox', { name: 'Product name' });

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', 'Search saved products');
    expect(input).toHaveClass('rounded-md', 'border-[var(--color-border-default)]');
  });
});
