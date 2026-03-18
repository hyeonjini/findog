import type { ReactNode } from 'react';
import Link from 'next/link';
import { AuthProviders } from './_components/AuthProviders';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProviders>
      <div
        className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
        style={{ background: 'linear-gradient(160deg, var(--color-brand-50) 0%, var(--color-bg-subtle) 50%, var(--color-bg-base) 100%)' }}
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <span style={{ fontSize: '2rem' }}>🐕</span>
            <span
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-brand-500)',
                letterSpacing: '-0.02em',
              }}
            >
              FinDog
            </span>
          </Link>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
            }}
          >
            상품 가격 추적 서비스
          </p>
        </div>

        {/* Card wrapper */}
        <div
          className="w-full max-w-sm"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border-default)',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>

        {/* Footer */}
        <p
          className="mt-8"
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-disabled)',
          }}
        >
          © 2026 FinDog. All rights reserved.
        </p>
      </div>
    </AuthProviders>
  );
}
