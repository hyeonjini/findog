export default function ProfileLoading() {
  return (
    <div data-testid="profile-loading" className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto mt-8">
        <div className="animate-pulse rounded-lg border border-[--color-border-default] bg-[--color-surface-default] p-6">
          <div className="h-6 w-32 rounded bg-[--color-surface-hover]" />

          <div className="mt-6 space-y-[--space-4]">
            <div>
              <div className="h-3 w-10 rounded bg-[--color-surface-hover]" />
              <div className="mt-[--space-1] h-4 w-48 rounded bg-[--color-surface-hover]" />
            </div>

            <div>
              <div className="h-3 w-24 rounded bg-[--color-surface-hover]" />
              <div className="mt-[--space-1] h-4 w-36 rounded bg-[--color-surface-hover]" />
            </div>

            <div>
              <div className="h-3 w-20 rounded bg-[--color-surface-hover]" />
              <div className="mt-[--space-1] h-3 w-56 rounded bg-[--color-surface-hover]" />
            </div>
          </div>

          <div className="mt-8 border-t border-[--color-border-default] pt-6">
            <div className="h-9 w-20 rounded-md bg-[--color-surface-hover]" />
          </div>
        </div>
      </div>
    </div>
  );
}
