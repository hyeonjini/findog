import { useState, useEffect } from 'react';
import type { ExtensionResponse } from '../../lib/messaging/types';
import { LoginForm } from '../../components/LoginForm';
import { SaveButton } from '../../components/SaveButton';
import { StatusMessage } from '../../components/StatusMessage';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'duplicate';

export function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [pageTitle, setPageTitle] = useState<string>('');
  const [pageUrl, setPageUrl] = useState<string>('');

  useEffect(() => {
    // Check auth state on popup open
    browser.runtime.sendMessage({ type: 'CHECK_AUTH' }).then((response: ExtensionResponse) => {
      if (response?.authenticated) {
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
      }
    }).catch(() => {
      setAuthState('unauthenticated');
    });
  }, []);

  // Get current tab info when authenticated
  useEffect(() => {
    if (authState === 'authenticated') {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]: chrome.tabs.Tab[]) => {
        setPageTitle(tab?.title ?? '');
        setPageUrl(tab?.url ?? '');
      });
    }
  }, [authState]);

  async function handleSave() {
    setSaveStatus('saving');
    setStatusMessage(undefined);

    try {
      const response = await browser.runtime.sendMessage({
        type: 'SAVE_PRODUCT',
        payload: {
          source_url: pageUrl,
          source_title: pageTitle || pageUrl,
        },
      });

      if (response?.error === 'ALREADY_SAVED') {
        setSaveStatus('duplicate');
      } else if (response?.error === 'AUTH_REQUIRED') {
        setAuthState('unauthenticated');
      } else if (response?.error) {
        setSaveStatus('error');
        setStatusMessage(response.error);
      } else if (response?.data) {
        setSaveStatus('saved');
        setStatusMessage(`"${response.data.source_title}" saved!`);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
      setStatusMessage('Could not connect to FinDog service.');
    }
  }

  async function handleLogout() {
    await browser.runtime.sendMessage({ type: 'LOGOUT' });
    setAuthState('unauthenticated');
    setSaveStatus('idle');
  }

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

  // Authenticated — save flow
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontWeight: 700, fontSize: '16px' }}>FinDog</span>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          Sign out
        </button>
      </div>

      {pageTitle && (
        <p style={{
          fontSize: '13px',
          color: '#374151',
          marginBottom: '12px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {pageTitle}
        </p>
      )}

      <SaveButton
        onSave={handleSave}
        saving={saveStatus === 'saving'}
        disabled={!pageUrl}
      />

      <StatusMessage status={saveStatus} message={statusMessage} />
    </div>
  );
}
