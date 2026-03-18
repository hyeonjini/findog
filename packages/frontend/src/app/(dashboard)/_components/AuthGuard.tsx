'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@findog/design-system';
import { useAuthStore } from '@/stores/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--color-bg-subtle)' }}
    >
      <header
        className="sticky top-0 z-10 flex min-h-14 flex-wrap items-center gap-y-1 px-[--space-4]"
        style={{
          backgroundColor: 'var(--color-bg-base)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Link
          href="/products"
          className="flex items-center gap-1.5 text-[length:--font-size-lg] font-[number:--font-weight-bold] tracking-tight hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-brand-500)' }}
        >
          <span>🐕</span>
          <span>FinDog</span>
        </Link>

        <nav className="ml-[--space-6] flex items-center gap-3">
          <Link
            href="/products"
            className="min-h-[32px] inline-flex items-center text-[length:--font-size-sm] transition-colors hover:text-[--color-brand-500]"
            style={{
              color: pathname.startsWith('/products')
                ? 'var(--color-brand-500)'
                : 'var(--color-text-muted)',
              fontWeight: pathname.startsWith('/products')
                ? 'var(--font-weight-semibold)'
                : 'var(--font-weight-normal)',
              borderBottom: pathname.startsWith('/products')
                ? '2px solid var(--color-brand-500)'
                : '2px solid transparent',
              paddingBottom: '2px',
            }}
          >
            Products
          </Link>
          <Link
            href="/profile"
            className="min-h-[32px] inline-flex items-center text-[length:--font-size-sm] transition-colors hover:text-[--color-brand-500]"
            style={{
              color: pathname.startsWith('/profile')
                ? 'var(--color-brand-500)'
                : 'var(--color-text-muted)',
              fontWeight: pathname.startsWith('/profile')
                ? 'var(--font-weight-semibold)'
                : 'var(--font-weight-normal)',
              borderBottom: pathname.startsWith('/profile')
                ? '2px solid var(--color-brand-500)'
                : '2px solid transparent',
              paddingBottom: '2px',
            }}
          >
            Profile
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-[--space-3]">
          {email && (
            <span
              data-testid="dashboard-user-email"
              className="hidden text-[length:--font-size-sm] sm:inline"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-grey-100)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {email}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-testid="dashboard-logout"
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex-1 px-[--space-4] py-[--space-6]">
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
