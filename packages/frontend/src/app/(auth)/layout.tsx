import type { ReactNode } from 'react';
import Link from 'next/link';
import { AuthProviders } from './_components/AuthProviders';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProviders>
      <div className="flex min-h-screen flex-col items-center justify-center px-[--space-4] py-[--space-8]">
        <div className="mb-[--space-8] text-center">
          <Link
            href="/"
            className="text-2xl font-[number:--font-weight-bold] tracking-tight text-[--color-text-primary]"
          >
            FinDog
          </Link>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </AuthProviders>
  );
}
