import type { ReactNode } from 'react';
import { DashboardProviders } from './_components/DashboardProviders';
import { AuthGuard } from './_components/AuthGuard';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardProviders>
      <AuthGuard>{children}</AuthGuard>
    </DashboardProviders>
  );
}
