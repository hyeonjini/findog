'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export function LogoutButton() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  async function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-red-600 hover:text-red-800 font-medium"
    >
      Sign out
    </button>
  );
}
