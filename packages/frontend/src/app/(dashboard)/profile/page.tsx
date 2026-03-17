import { redirect } from 'next/navigation';

import { ServerApiError, serverApiFetch } from '@/lib/api/server';
import type { UserPublicResponse } from '@findog/api-client/endpoints/index.schemas';
import { ProfileCard } from '@/features/profile/components/ProfileCard';

export const dynamic = 'force-dynamic';

async function getProfile() {
  try {
    return await serverApiFetch<UserPublicResponse>('/api/users/me');
  } catch (error) {
    if (error instanceof ServerApiError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }

    throw error;
  }
}

export default async function ProfilePage() {
  const data = await getProfile();

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileCard user={data} />
    </div>
  );
}
