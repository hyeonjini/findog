'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@findog/design-system';
import { useAuthStore } from '@/stores/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const hydrate = useAuthStore((s) => s.hydrate);

  /* Trigger store rehydration from localStorage on mount.
     skipHydration: true in the store config means the persist middleware
     does NOT auto-hydrate during SSR. We must call hydrate() client-side
     so the guard does not false-positive redirect authenticated users. */
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  function handleLogout() {
    clearAuth();
    router.replace('/login');
  }

  if (!isHydrated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        aria-busy="true"
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[--color-brand-500] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const email =
    user && typeof user.email === 'string' ? user.email : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[--color-border-default] bg-[--color-surface-default] px-[--space-4]">
        <span className="text-[length:--font-size-lg] font-[number:--font-weight-bold] tracking-tight text-[--color-text-primary]">
          FinDog
        </span>

        <div className="flex items-center gap-[--space-3]">
          {email && (
            <span
              data-testid="dashboard-user-email"
              className="hidden text-[length:--font-size-sm] text-[--color-text-muted] sm:inline"
            >
              {email}
            </span>
          )}
          <Link
            href="/profile"
            className="text-[length:--font-size-sm] text-[--color-text-muted] hover:text-[--color-text-primary]"
          >
            Profile
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-testid="dashboard-logout"
          >
            Log out
          </Button>
        </div>
      </header>

      <main className="flex-1 px-[--space-4] py-[--space-6]">
        {children}
      </main>
    </div>
  );
}
