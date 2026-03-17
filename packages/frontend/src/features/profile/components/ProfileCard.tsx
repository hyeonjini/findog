import { LogoutButton } from './LogoutButton';

interface ProfileCardProps {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const formattedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-lg mx-auto mt-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h1 className="text-xl font-semibold mb-6">My Account</h1>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</p>
            <p className="text-sm text-gray-900">{user.email}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Member since</p>
            <p className="text-sm text-gray-900">{formattedDate}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Account ID</p>
            <p className="text-xs text-gray-400 font-mono">{user.id}</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
