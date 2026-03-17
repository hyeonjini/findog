import type { UserPublicResponse } from '@findog/api-client/endpoints/index.schemas';
import { LogoutButton } from './LogoutButton';

interface ProfileCardProps {
  user: UserPublicResponse;
}

export function ProfileCard({ user }: ProfileCardProps) {
  const formattedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-lg mx-auto mt-8">
      <div
        className="rounded-lg shadow-sm p-6"
        style={{
          background: 'var(--color-surface-default)',
          border: '1px solid var(--color-border-default)',
        }}
      >
        <h1
          className="text-xl font-semibold mb-6"
          style={{ color: 'var(--color-text-primary)' }}
        >
          My Account
        </h1>

        <div className="space-y-4">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-wide mb-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Email
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {user.email}
            </p>
          </div>

          <div>
            <p
              className="text-xs font-medium uppercase tracking-wide mb-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Member since
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {formattedDate}
            </p>
          </div>

          <div>
            <p
              className="text-xs font-medium uppercase tracking-wide mb-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Account ID
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {user.id}
            </p>
          </div>
        </div>

        <div
          className="mt-8 pt-6"
          style={{ borderTop: '1px solid var(--color-border-default)' }}
        >
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
