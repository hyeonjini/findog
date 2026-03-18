'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export function LogoutButton() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  async function handleLogout() {
    clearAuth();
    router.replace('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className="text-[length:--font-size-sm] font-medium"
      style={{ color: 'var(--color-error-600)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error-500)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-error-600)')}
    >
      Sign out
    </button>
  );
}
