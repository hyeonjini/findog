import type { ReactNode } from 'react';
import { AuthGuard } from './_components/AuthGuard';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
