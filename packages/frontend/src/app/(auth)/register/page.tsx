'use client';

import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
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
          회원가입
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          가격 추적을 시작하세요
        </p>
      </div>

      <RegisterForm />

      <p
        className="mt-6 text-center"
        style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}
      >
        이미 계정이 있으신가요?{' '}
        <Link
          href="/login"
          style={{
            color: 'var(--color-brand-500)',
            fontWeight: 'var(--font-weight-medium)',
            textDecoration: 'none',
          }}
          className="hover:underline"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
