import { browser } from 'wxt/browser';
import type { Browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import type { ExtensionMessage, ExtensionResponse } from '../lib/messaging/types';
import { API_BASE } from '../lib/auth/api-base';
import {
  getValidAccessToken,
  isAuthenticated,
  login,
  logout,
} from '../lib/auth/token-manager';
import type { ProductPayload } from '../lib/product/types';

export default defineBackground({
  type: 'module',
  main() {
    browser.runtime.onMessage.addListener(
      (
        message: ExtensionMessage,
        _sender: Browser.runtime.MessageSender,
        sendResponse: (response: ExtensionResponse) => void,
      ) => {
        handleMessage(message)
          .then(sendResponse)
          .catch((err: unknown) =>
            sendResponse({
              type: message.type,
              error: err instanceof Error ? err.message : 'Unknown error',
            } as ExtensionResponse),
          );

        return true;
      },
    );
  },
});

async function handleMessage(
  message: ExtensionMessage,
): Promise<ExtensionResponse> {
  switch (message.type) {
    case 'CHECK_AUTH': {
      const authenticated = await isAuthenticated();
      return { type: 'CHECK_AUTH', authenticated };
    }

    case 'LOGIN': {
      const result = await login(message.payload.email, message.payload.password);
      return { type: 'LOGIN', success: result.success, error: result.error };
    }

    case 'LOGOUT': {
      await logout();
      return { type: 'LOGOUT', success: true };
    }

    case 'SAVE_PRODUCT': {
      return saveProduct(message.payload);
    }

    case 'EXTRACT_PRODUCT': {
      return {
        type: 'EXTRACT_PRODUCT',
        data: { title: null, url: '', source: 'dom-fallback' },
      };
    }

    default: {
      const _exhaustive: never = message;
      throw new Error(`Unknown message type: ${String(_exhaustive)}`);
    }
  }
}

async function saveProduct(
  payload: ProductPayload,
): Promise<ExtensionResponse> {
  const token = await getValidAccessToken();
  if (!token) {
    return { type: 'SAVE_PRODUCT', data: null, error: 'AUTH_REQUIRED' };
  }

  try {
    const res = await fetch(`${API_BASE}/tracked-products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: payload.source_url,
        source_title: payload.source_title,
      }),
    });

    if (res.status === 409) {
      return { type: 'SAVE_PRODUCT', data: null, error: 'ALREADY_SAVED' };
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data?.detail ?? `HTTP ${res.status}`;

      return {
        type: 'SAVE_PRODUCT',
        data: null,
        error: typeof message === 'string' ? message : `HTTP ${res.status}`,
      };
    }

    const saved = await res.json();
    return {
      type: 'SAVE_PRODUCT',
      data: {
        id: saved.id,
        source_title: saved.source_title,
        source_url: saved.source_url,
      },
    };
  } catch (err: unknown) {
    return {
      type: 'SAVE_PRODUCT',
      data: null,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}
