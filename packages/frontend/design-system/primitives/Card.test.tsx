import { render, screen } from '@testing-library/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './Card';

describe('Card', () => {
  it('renders compound content with elevated styling', () => {
    render(
      <Card data-testid="tracked-product-card" padding="md" variant="elevated">
        <CardHeader>
          <CardTitle>Tracked product</CardTitle>
          <CardDescription>Monitoring the latest price change.</CardDescription>
        </CardHeader>
        <CardContent>Current lowest price</CardContent>
        <CardFooter>Updated just now</CardFooter>
      </Card>,
    );

    const card = screen.getByTestId('tracked-product-card');

    expect(screen.getByRole('heading', { name: 'Tracked product' })).toBeVisible();
    expect(screen.getByText('Monitoring the latest price change.')).toBeVisible();
    expect(screen.getByText('Current lowest price')).toBeVisible();
    expect(screen.getByText('Updated just now')).toBeVisible();
    expect(card).toHaveClass('shadow-md', 'p-[--space-4]');
  });
});
