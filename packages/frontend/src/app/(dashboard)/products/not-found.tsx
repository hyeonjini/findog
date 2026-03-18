import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div
      data-testid="products-not-found"
      className="flex flex-col items-center justify-center py-[--space-12] text-center"
    >
      <div className="mb-[--space-6] rounded-full bg-[--color-surface-hover] p-[--space-6]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-[--color-text-muted]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h2 className="text-[length:--font-size-lg] font-[number:--font-weight-bold] text-[--color-text-primary]">
        Product not found
      </h2>

      <p className="mt-[--space-2] max-w-sm text-[length:--font-size-sm] leading-[--line-height-normal] text-[--color-text-muted]">
        The tracked product you&apos;re looking for doesn&apos;t exist or has
        been removed.
      </p>

      <Link
        href="/products"
        className="mt-[--space-6] text-[length:--font-size-sm] font-[number:--font-weight-medium] text-[--color-brand-500] hover:text-[--color-brand-600]"
      >
        Back to products
      </Link>
    </div>
  );
}
