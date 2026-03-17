import { useState, useEffect } from 'react';
import { LoginForm } from '../../components/LoginForm';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    // Check auth state on popup open
    browser.runtime.sendMessage({ type: 'CHECK_AUTH' }).then((response: any) => {
      if (response?.authenticated) {
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
      }
    }).catch(() => {
      setAuthState('unauthenticated');
    });
  }, []);

  if (authState === 'loading') {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <LoginForm
        onLoginSuccess={() => setAuthState('authenticated')}
      />
    );
  }

  // Authenticated — SaveButton rendered in next task
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontWeight: 600, fontSize: '16px' }}>FinDog</span>
      </div>
      <p style={{ color: '#666', fontSize: '13px' }}>
        Logged in. Save button will be added next.
      </p>
    </div>
  );
}
