'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@findog/design-system';
import { useAuthStore } from '@/stores/auth.store';

const FEATURES = [
  {
    icon: '📊',
    title: '가격 추적',
    description: '저장한 상품의 가격 변동을 자동으로 추적하고 히스토리를 확인하세요.',
  },
  {
    icon: '🔍',
    title: '최저가 검색',
    description: '국내 주요 쇼핑몰에서 동일 상품의 최저가를 한눈에 비교하세요.',
  },
  {
    icon: '🔔',
    title: '재입고 알림',
    description: '품절된 상품이 재입고되면 이메일로 즉시 알려드립니다.',
  },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace('/products');
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-subtle)' }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent"
          style={{ borderColor: 'var(--color-brand-500)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--color-bg-subtle)', fontFamily: 'var(--font-sans)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: 'var(--color-bg-base)',
          borderBottom: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <span
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--color-brand-500)', fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}
        >
          🐕 FinDog
        </span>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">로그인</Link>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link href="/register">시작하기</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
          style={{
            backgroundColor: 'var(--color-brand-50)',
            color: 'var(--color-brand-600)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          🎉 가격 추적 서비스 오픈
        </div>

        <h1
          className="mb-4 max-w-2xl text-5xl font-bold leading-tight tracking-tight"
          style={{
            color: 'var(--color-text-primary)',
            fontSize: 'clamp(2rem, 5vw, var(--font-size-3xl))',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          상품 가격을 추적하고<br />
          <span style={{ color: 'var(--color-brand-500)' }}>최저가</span>를 찾아보세요
        </h1>

        <p
          className="mb-8 max-w-md"
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-lg)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          원하는 상품을 저장하면 FinDog이 가격 변동을 추적하고,
          최저가와 재입고 알림을 보내드립니다.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/register">무료로 시작하기</Link>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href="/login">이미 계정이 있어요</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-2xl p-6"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <span className="text-3xl">{feature.icon}</span>
                <h3
                  style={{
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: 'var(--line-height-normal)',
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-6 text-center"
        style={{
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
          borderTop: '1px solid var(--color-border-default)',
        }}
      >
        © 2026 FinDog. All rights reserved.
      </footer>
    </div>
  );
}
