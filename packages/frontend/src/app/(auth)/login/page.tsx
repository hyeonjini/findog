'use client';

import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: '0.25rem',
          }}
        >
          로그인
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          계정에 로그인하세요
        </p>
      </div>

      <LoginForm />

      <p
        className="mt-6 text-center"
        style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}
      >
        계정이 없으신가요?{' '}
        <Link
          href="/register"
          style={{
            color: 'var(--color-brand-500)',
            fontWeight: 'var(--font-weight-medium)',
            textDecoration: 'none',
          }}
          className="hover:underline"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}
