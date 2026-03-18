function CardSkeleton({ title }: { title?: boolean }) {
  return (
    <div className="rounded-lg border border-[--color-border-default] bg-[--color-surface-default] p-[--space-4]">
      {title && <div className="mb-[--space-3] h-4 w-16 rounded bg-[--color-surface-hover]" />}
      <div className="space-y-[--space-2]">
        <div className="h-4 w-full rounded bg-[--color-surface-hover]" />
        <div className="h-4 w-2/3 rounded bg-[--color-surface-hover]" />
      </div>
    </div>
  );
}

export default function ProductDetailLoading() {
  return (
    <div data-testid="product-detail-loading" className="animate-pulse space-y-[--space-4]">
      <div className="h-4 w-32 rounded bg-[--color-surface-hover]" />

      <div className="aspect-video w-full rounded-lg bg-[--color-surface-hover]" />

      <div>
        <div className="flex items-start justify-between gap-[--space-3]">
          <div className="h-5 w-3/4 rounded bg-[--color-surface-hover]" />
          <div className="h-5 w-16 shrink-0 rounded-full bg-[--color-surface-hover]" />
        </div>
        <div className="mt-[--space-1] h-3 w-24 rounded bg-[--color-surface-hover]" />
      </div>

      <CardSkeleton title />

      <CardSkeleton title />

      <div className="rounded-lg border border-[--color-border-default] bg-[--color-surface-default] p-[--space-4]">
        <div className="mb-[--space-3] h-4 w-16 rounded bg-[--color-surface-hover]" />
        <div className="space-y-[--space-3]">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-[--color-border-default] py-[--space-2] last:border-b-0">
              <div className="h-3 w-20 rounded bg-[--color-surface-hover]" />
              <div className="h-3 w-24 rounded bg-[--color-surface-hover]" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[--space-6] flex gap-[--space-2]">
        <div className="h-9 w-16 rounded-md bg-[--color-surface-hover]" />
        <div className="h-9 w-20 rounded-md bg-[--color-surface-hover]" />
        <div className="h-9 w-20 rounded-md bg-[--color-surface-hover]" />
      </div>
    </div>
  );
}
