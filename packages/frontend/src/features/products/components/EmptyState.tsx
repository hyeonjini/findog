import { cn } from '@findog/design-system/utils/cn';

export interface EmptyStateProps {
  className?: string;
}

export function EmptyState({ className }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className={cn(
        'flex flex-col items-center justify-center py-[--space-12] text-center',
        className,
      )}
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
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>

      <h3 className="text-[length:--font-size-lg] font-[number:--font-weight-bold] text-[--color-text-primary]">
        No tracked products yet
      </h3>

      <p className="mt-[--space-2] max-w-sm text-[length:--font-size-sm] leading-[--line-height-normal] text-[--color-text-muted]">
        Save products from any shopping page using the FinDog browser extension.
        We&apos;ll track prices and availability for you.
      </p>
    </div>
  );
}
