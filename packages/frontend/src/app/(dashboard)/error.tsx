'use client';

import Link from 'next/link';
import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error reporting service in the future
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4"
    >
      <p className="text-4xl">⚠️</p>
      <h2
        className="text-xl font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Something went wrong
      </h2>
      <p
        className="text-sm max-w-sm"
        style={{ color: 'var(--color-text-muted)' }}
      >
        An unexpected error occurred. Please try again or go back to your products.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{
            background: 'var(--color-brand-500)',
            color: '#ffffff',
          }}
        >
          Try again
        </button>
        <Link
          href="/products"
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{
            background: 'var(--color-surface-hover)',
            color: 'var(--color-text-primary)',
          }}
        >
          Go to products
        </Link>
      </div>
    </div>
  );
}
