function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-[--color-border-default] bg-[--color-surface-default]">
      <div className="flex gap-[--space-3] p-[--space-3]">
        <div className="h-20 w-20 shrink-0 rounded-md bg-[--color-surface-hover]" />

        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="h-4 w-3/4 rounded bg-[--color-surface-hover]" />
            <div className="mt-[--space-1] h-3 w-1/2 rounded bg-[--color-surface-hover]" />
          </div>

          <div className="mt-[--space-2] flex items-center justify-between">
            <div className="h-4 w-16 rounded bg-[--color-surface-hover]" />
            <div className="h-5 w-14 rounded-full bg-[--color-surface-hover]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsLoading() {
  return (
    <div data-testid="products-loading" className="space-y-[--space-6]">
      <div className="h-8 w-48 animate-pulse rounded bg-[--color-surface-hover]" />

      <div className="grid gap-[--space-3] sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
