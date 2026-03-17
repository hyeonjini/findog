type Status = 'idle' | 'saving' | 'saved' | 'error' | 'duplicate';

interface StatusMessageProps {
  status: Status;
  message?: string;
}

export function StatusMessage({ status, message }: StatusMessageProps) {
  if (status === 'idle' || status === 'saving') return null;

  const styles: Record<Exclude<Status, 'idle' | 'saving'>, { bg: string; color: string; icon: string }> = {
    saved: { bg: '#f0fdf4', color: '#16a34a', icon: '\u2713' },
    error: { bg: '#fef2f2', color: '#dc2626', icon: '\u2717' },
    duplicate: { bg: '#fff7ed', color: '#ea580c', icon: '!' },
  };

  const style = styles[status as 'saved' | 'error' | 'duplicate'];

  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: '6px',
      background: style.bg,
      color: style.color,
      fontSize: '13px',
      marginTop: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <span style={{ fontWeight: 700 }}>{style.icon}</span>
      <span>{message ?? (status === 'saved' ? 'Product saved!' : status === 'duplicate' ? 'Already saved.' : 'Something went wrong.')}</span>
    </div>
  );
}
