# Chrome Extension Architecture & Conventions

**Stack:** React + TypeScript + Vite + CRXJS  
**Manifest Version:** MV3  
**Package:** `packages/chrome-extension`

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [MV3 Architecture](#mv3-architecture)
3. [Messaging Patterns](#messaging-patterns)
4. [Security](#security)
5. [API Communication](#api-communication)
6. [State Management](#state-management)
7. [Content Script Product Extraction](#content-script-product-extraction)
8. [Build Tooling](#build-tooling)
9. [Testing](#testing)
10. [Context Capability Matrix](#context-capability-matrix)
11. [Quick Reference Card](#quick-reference-card)

---

## Directory Structure

```
packages/chrome-extension/
├── src/
│   ├── background/
│   │   ├── index.ts                  # Service worker entry, message router
│   │   ├── api.service.ts            # All fetch calls to backend
│   │   ├── product.handler.ts        # Handles SAVE_PRODUCT, SEARCH_PRICE messages
│   │   ├── restock.handler.ts        # Handles restock check scheduling
│   │   └── store.backend.ts          # initStoreBackend, chrome.storage sync
│   ├── content/
│   │   ├── index.ts                  # Content script entry, mounts React if needed
│   │   ├── extractor.service.ts      # Product data extraction logic
│   │   ├── overlay.handler.ts        # Handles DOM overlay injection
│   │   └── store.ts                  # Content-side store slice (read-only mirror)
│   ├── popup/
│   │   ├── index.tsx                 # Popup entry, calls storeReady before render
│   │   ├── App.tsx
│   │   ├── pages/
│   │   └── store.ts                  # Popup-side store slice
│   ├── options/
│   │   ├── index.tsx                 # Options page entry
│   │   ├── App.tsx
│   │   └── store.ts
│   └── shared/
│       ├── messages.ts               # Discriminated union message types (source of truth)
│       ├── storage.ts                # chrome.storage read/write helpers
│       ├── errors.ts                 # Shared error types
│       └── types.ts                  # Domain types: Product, PricePoint, etc.
├── manifest.config.ts                # defineManifest (CRXJS)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### File Suffix Conventions

| Suffix | Purpose |
|---|---|
| `.handler.ts` | Receives a message, performs work, returns a response. One handler per message domain. |
| `.service.ts` | Stateless logic: fetch calls, DOM parsing, data transformation. No direct message handling. |
| `.store.ts` | Zustand store slice. Includes chrome.storage adapter where cross-context sync is needed. |

---

## MV3 Architecture

### Service Worker Lifecycle

The background service worker is **ephemeral**. Chrome terminates it after ~30 seconds of idle time. It can restart at any moment.

Rules:
- Never store state in module-level variables that must survive across events. Use `chrome.storage.local` or `chrome.storage.session` instead.
- Every event listener (`chrome.runtime.onMessage`, `chrome.alarms.onAlarm`, etc.) must be registered at the **top level** of `background/index.ts`, not inside async callbacks or conditionals. Chrome only re-attaches listeners registered synchronously on startup.
- Use `chrome.alarms` for periodic work, not `setInterval`. Alarms survive service worker restarts; intervals do not.
- If an operation must outlive the current event, call `chrome.storage` to persist intermediate state before the worker sleeps.

```ts
// background/index.ts — correct pattern
chrome.runtime.onMessage.addListener(routeMessage);
chrome.alarms.onAlarm.addListener(handleAlarm);
chrome.runtime.onInstalled.addListener(handleInstall);
```

```ts
// WRONG — listener registered inside a promise callback
someAsyncSetup().then(() => {
  chrome.runtime.onMessage.addListener(routeMessage); // may never fire
});
```

### Content Script Isolation

Content scripts run in an **isolated world**: they share the page's DOM but have a completely separate JavaScript context. The page's scripts cannot access content script variables, and vice versa.

Rules:
- Never rely on `window` properties set by the page's own scripts.
- To read page data, parse the DOM or `<script type="application/ld+json">` tags directly.
- To communicate with the page's JavaScript context (rare), use `window.postMessage` with strict origin checks. Prefer DOM parsing over `postMessage` whenever possible.
- Content scripts cannot use `chrome.storage` directly in all configurations; route storage reads/writes through the background via messaging when in doubt.

### Popup Limitations

The popup is a **transient** browser window. It closes the moment the user clicks away, destroying all in-memory state.

Rules:
- Never initiate a `fetch` call directly from popup code. The popup may close before the request completes, and CSP blocks many remote scripts anyway.
- All network requests go through the background service worker via `chrome.runtime.sendMessage`.
- On mount, call `storeReady()` to hydrate state from `chrome.storage` before rendering data-dependent UI.
- Do not assume the popup will be open when an async operation completes. Design for the case where the popup is gone.

---

## Messaging Patterns

### Discriminated Union Types

All message types live in `shared/messages.ts`. This is the single source of truth for the message contract between contexts.

```ts
// shared/messages.ts

export type AppMessage =
  | { type: 'SAVE_PRODUCT'; payload: { url: string; title: string; imageUrl?: string } }
  | { type: 'GET_SAVED_PRODUCTS' }
  | { type: 'SEARCH_PRICE'; payload: { productId: string } }
  | { type: 'CHECK_RESTOCK'; payload: { productId: string } };

export type AppResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

Never use plain string literals for message types outside this file. Import from `shared/messages.ts`.

### Async Response Pattern

When a message handler needs to perform async work and return a result, the `onMessage` listener **must return `true`** synchronously. This keeps the message channel open until `sendResponse` is called.

```ts
// background/index.ts
chrome.runtime.onMessage.addListener(
  (message: AppMessage, sender, sendResponse) => {
    routeMessage(message, sender)
      .then(sendResponse)
      .catch((err) => sendResponse({ ok: false, error: err.message }));

    return true; // REQUIRED — keeps channel open for async sendResponse
  }
);
```

Forgetting `return true` causes the channel to close immediately. The caller receives `undefined` and the promise rejects with "The message port closed before a response was received."

### Message Routing in background/index.ts

The router dispatches to typed handlers. Each handler is responsible for one domain.

```ts
// background/index.ts
import { handleProduct } from './product.handler';
import { handleRestock } from './restock.handler';
import type { AppMessage, AppResponse } from '../shared/messages';

async function routeMessage(
  message: AppMessage,
  sender: chrome.runtime.MessageSender
): Promise<AppResponse> {
  switch (message.type) {
    case 'SAVE_PRODUCT':
    case 'SEARCH_PRICE':
      return handleProduct(message, sender);
    case 'CHECK_RESTOCK':
      return handleRestock(message, sender);
    case 'GET_SAVED_PRODUCTS':
      return handleProduct(message, sender);
    default: {
      const _exhaustive: never = message;
      return { ok: false, error: `Unknown message type` };
    }
  }
}
```

The `never` exhaustiveness check ensures TypeScript catches unhandled message types at compile time.

### Sending Messages from Content Scripts and Popup

```ts
// Any non-background context
import type { AppMessage, AppResponse } from '../shared/messages';

async function sendToBackground<T>(message: AppMessage): Promise<AppResponse<T>> {
  return chrome.runtime.sendMessage<AppMessage, AppResponse<T>>(message);
}
```

---

## Security

### Content Security Policy

The `manifest.config.ts` must declare a strict CSP. MV3 already disallows `unsafe-eval` for extension pages by default; make it explicit.

```ts
// manifest.config.ts (extension_pages CSP)
content_security_policy: {
  extension_pages: "script-src 'self'; object-src 'self'",
}
```

Rules:
- No `unsafe-eval`. This blocks `eval()`, `new Function()`, and dynamic code execution. Vite's production build is compatible; dev HMR requires CRXJS's built-in workaround.
- No remote scripts. All scripts must be bundled into the extension package. Never load scripts from a CDN at runtime.
- No `unsafe-inline` for scripts. Inline event handlers (`onclick="..."`) are forbidden; use `addEventListener`.

### chrome.storage vs localStorage Decision Matrix

| Scenario | Use |
|---|---|
| Data must be accessible from background service worker | `chrome.storage.local` |
| Data must sync across the user's devices | `chrome.storage.sync` |
| Data is session-only (cleared on browser close) | `chrome.storage.session` |
| Data is only needed within a single popup session | In-memory (Zustand store, no persistence) |
| **Never** | `localStorage` from background or content scripts |

`localStorage` is scoped to an origin and is not accessible from the service worker context. `chrome.storage` is accessible from all extension contexts and is the correct choice for any data that needs to cross context boundaries.

### Permission Minimization

Declare only the permissions the extension actually uses. Request sensitive permissions at runtime when possible.

```ts
// manifest.config.ts
permissions: ['storage', 'alarms', 'activeTab'],
optional_permissions: ['tabs'],
host_permissions: ['http://localhost:8000/*'],
```

Rules:
- Use `activeTab` instead of `tabs` wherever possible. `activeTab` grants temporary access to the current tab only when the user invokes the extension. `tabs` grants persistent access to all tab URLs and titles, which triggers a warning during install.
- Declare `optional_permissions` for capabilities needed only in specific flows. Request them with `chrome.permissions.request()` at the moment they're needed, with user context.
- Do not declare `<all_urls>` host permissions unless the extension genuinely needs to run on every site. Enumerate specific hosts or use match patterns scoped to shopping domains.

---

## API Communication

### All Fetch Calls Through Background Only

Content scripts face CORS restrictions because they run in the context of the visited page's origin. The popup faces CSP restrictions on outbound requests. The background service worker has neither constraint.

```
Content Script  --[chrome.runtime.sendMessage]--> Background Service Worker --[fetch]--> Backend API
Popup           --[chrome.runtime.sendMessage]--> Background Service Worker --[fetch]--> Backend API
```

**Never call `fetch` from a content script or popup.** Route all API calls through `background/api.service.ts`.

```ts
// background/api.service.ts
const BASE_URL = 'http://localhost:8000';

export async function saveProduct(data: SaveProductRequest): Promise<Product> {
  const res = await fetchWithRetry(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}
```

### Error Handling

```ts
// shared/errors.ts
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
```

Handlers catch errors and return typed `AppResponse` objects. Never let unhandled rejections propagate to `sendResponse`.

```ts
// background/product.handler.ts
export async function handleProduct(
  message: Extract<AppMessage, { type: 'SAVE_PRODUCT' }>,
  _sender: chrome.runtime.MessageSender
): Promise<AppResponse<Product>> {
  try {
    const product = await saveProduct(message.payload);
    return { ok: true, data: product };
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, error: `API ${err.status}: ${err.message}` };
    }
    return { ok: false, error: 'Unexpected error' };
  }
}
```

### Retry with Exponential Backoff

```ts
// background/api.service.ts
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  baseDelayMs = 500
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt < retries - 1) {
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  return fetch(url, options); // final attempt, let caller handle failure
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
```

Retry only on 429 (rate limit) and 5xx (server error). Do not retry 4xx client errors.

---

## State Management

### Zustand with chrome.storage Adapter

State that must persist across popup opens or be shared between popup and content scripts must be backed by `chrome.storage`.

```ts
// shared/storage.ts
import { StateStorage } from 'zustand/middleware';

export const chromeStorageLocal: StateStorage = {
  getItem: (name) =>
    new Promise((resolve) => {
      chrome.storage.local.get(name, (result) => resolve(result[name] ?? null));
    }),
  setItem: (name, value) =>
    new Promise((resolve) => {
      chrome.storage.local.set({ [name]: value }, resolve);
    }),
  removeItem: (name) =>
    new Promise((resolve) => {
      chrome.storage.local.remove(name, resolve);
    }),
};
```

```ts
// popup/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chromeStorageLocal } from '../shared/storage';

interface PopupStore {
  savedProducts: Product[];
  setSavedProducts: (products: Product[]) => void;
}

export const usePopupStore = create<PopupStore>()(
  persist(
    (set) => ({
      savedProducts: [],
      setSavedProducts: (products) => set({ savedProducts: products }),
    }),
    { name: 'popup-store', storage: chromeStorageLocal }
  )
);
```

### initStoreBackend

The background service worker initializes the store backend on startup to handle storage change events and keep state consistent.

```ts
// background/store.backend.ts
export function initStoreBackend() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    // Broadcast relevant changes to open tabs if needed
  });
}
```

```ts
// background/index.ts
import { initStoreBackend } from './store.backend';

initStoreBackend(); // called synchronously at top level
chrome.runtime.onMessage.addListener(routeMessage);
```

### storeReady Before Render

The popup and options page must wait for the persisted store to hydrate before rendering data-dependent components.

```ts
// popup/index.tsx
import { usePopupStore } from './store';

function App() {
  const hydrated = usePopupStore.persist.hasHydrated();

  if (!hydrated) return <LoadingSpinner />;
  return <PopupContent />;
}
```

Alternatively, use the `onFinishHydration` callback to set a local ready flag.

---

## Content Script Product Extraction

Extract product data in priority order. Each strategy falls through to the next if it yields insufficient data.

### 1. JSON-LD (Highest Priority)

Most major e-commerce sites include structured data. Parse it first.

```ts
// content/extractor.service.ts
function extractFromJsonLd(): Partial<ProductData> | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent ?? '');
      const product = Array.isArray(data)
        ? data.find((d) => d['@type'] === 'Product')
        : data['@type'] === 'Product'
        ? data
        : null;
      if (!product) continue;
      return {
        title: product.name,
        imageUrl: product.image?.[0] ?? product.image,
        price: product.offers?.price,
        currency: product.offers?.priceCurrency,
      };
    } catch {
      continue;
    }
  }
  return null;
}
```

### 2. Open Graph Meta Tags

```ts
function extractFromOpenGraph(): Partial<ProductData> {
  const get = (property: string) =>
    document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)?.content;

  return {
    title: get('og:title'),
    imageUrl: get('og:image'),
    price: get('product:price:amount'),
    currency: get('product:price:currency'),
  };
}
```

### 3. Site-Specific CSS Selectors (Fallback)

Define selectors per domain in a config map. Only use this when JSON-LD and OG tags are absent or incomplete.

```ts
// content/extractor.service.ts
const SITE_SELECTORS: Record<string, SiteSelector> = {
  'example-shop.com': {
    title: 'h1.product-title',
    price: 'span.price-now',
    image: 'img.product-hero',
  },
};

function extractFromSelectors(hostname: string): Partial<ProductData> {
  const config = SITE_SELECTORS[hostname];
  if (!config) return {};
  return {
    title: document.querySelector(config.title)?.textContent?.trim(),
    price: document.querySelector(config.price)?.textContent?.trim(),
    imageUrl: document.querySelector<HTMLImageElement>(config.image)?.src,
  };
}
```

### Combining Strategies

```ts
export function extractProduct(): ProductData {
  const hostname = location.hostname.replace(/^www\./, '');
  const jsonLd = extractFromJsonLd() ?? {};
  const og = extractFromOpenGraph();
  const selectors = extractFromSelectors(hostname);

  // Earlier strategies take precedence
  return {
    url: location.href,
    title: jsonLd.title ?? og.title ?? selectors.title ?? document.title,
    imageUrl: jsonLd.imageUrl ?? og.imageUrl ?? selectors.imageUrl,
    price: jsonLd.price ?? og.price ?? selectors.price,
    currency: jsonLd.currency ?? og.currency ?? selectors.currency,
  };
}
```

---

## Build Tooling

### Vite + CRXJS

CRXJS handles manifest injection, content script HMR, and service worker bundling automatically.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';   // NOT @vitejs/plugin-react-swc
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [
    react(),       // SWC variant is incompatible with CRXJS — use Babel transform
    crx({ manifest }),
  ],
});
```

**Do not use `@vitejs/plugin-react-swc`.** CRXJS's HMR injection is incompatible with the SWC transform. Use `@vitejs/plugin-react` (Babel) instead.

### manifest.config.ts

```ts
// manifest.config.ts
import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'FinDog',
  version: '0.1.0',
  description: 'Save products and track prices across e-commerce platforms.',
  permissions: ['storage', 'alarms', 'activeTab'],
  optional_permissions: ['tabs'],
  host_permissions: ['http://localhost:8000/*'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: 'icons/icon48.png',
  },
  options_page: 'src/options/index.html',
  icons: {
    '16': 'icons/icon16.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
});
```

### Build Scripts

```json
// package.json (chrome-extension)
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## Testing

### Stack

- **Vitest** for unit and integration tests
- **vitest-chrome** for mocking the `chrome.*` APIs
- **jsdom** for content script DOM tests
- **@testing-library/react** for popup and options page component tests

### Setup

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

```ts
// src/test/setup.ts
import 'vitest-chrome';
// vitest-chrome attaches a fully mocked chrome object to globalThis
```

### Testing Handlers in Isolation

```ts
// background/product.handler.test.ts
import { describe, it, expect, vi } from 'vitest';
import { handleProduct } from './product.handler';
import * as apiService from './api.service';

vi.mock('./api.service');

describe('handleProduct', () => {
  it('returns ok response on successful save', async () => {
    vi.mocked(apiService.saveProduct).mockResolvedValue({ id: '1', title: 'Test' } as Product);

    const result = await handleProduct(
      { type: 'SAVE_PRODUCT', payload: { url: 'https://example.com', title: 'Test' } },
      {} as chrome.runtime.MessageSender
    );

    expect(result).toEqual({ ok: true, data: { id: '1', title: 'Test' } });
  });

  it('returns error response on API failure', async () => {
    vi.mocked(apiService.saveProduct).mockRejectedValue(new Error('Network error'));

    const result = await handleProduct(
      { type: 'SAVE_PRODUCT', payload: { url: 'https://example.com', title: 'Test' } },
      {} as chrome.runtime.MessageSender
    );

    expect(result.ok).toBe(false);
  });
});
```

### Testing Content Scripts with jsdom

```ts
// content/extractor.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { extractProduct } from './extractor.service';

describe('extractFromJsonLd', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('extracts product data from JSON-LD', () => {
    document.head.innerHTML = `
      <script type="application/ld+json">
        {"@type":"Product","name":"Blue Sneakers","offers":{"price":"59.99","priceCurrency":"USD"}}
      </script>
    `;

    const result = extractProduct();

    expect(result.title).toBe('Blue Sneakers');
    expect(result.price).toBe('59.99');
  });
});
```

### Testing Popup Components

```ts
// popup/App.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

// chrome.storage is mocked by vitest-chrome setup

describe('Popup App', () => {
  it('renders save button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});
```

---

## Context Capability Matrix

| Capability | Background | Content Script | Popup | Options |
|---|:---:|:---:|:---:|:---:|
| `fetch` to backend API | YES | NO | NO | YES* |
| `chrome.storage` read/write | YES | YES | YES | YES |
| `chrome.alarms` | YES | NO | NO | NO |
| `chrome.tabs` (with permission) | YES | NO | NO | NO |
| `chrome.runtime.sendMessage` | YES | YES | YES | YES |
| Access page DOM | NO | YES | NO | NO |
| Render React UI | NO | YES (injected) | YES | YES |
| Persist across browser sessions | YES (storage) | NO | NO | NO |
| Run during page load | YES (event-driven) | YES | NO | NO |
| `localStorage` | NO | NO (isolated) | YES | YES |
| `window.postMessage` to page | NO | YES | NO | NO |
| `chrome.notifications` | YES | NO | NO | NO |

*Popup can technically `fetch`, but CSP and transient lifecycle make it unreliable. Route through background.

---

## Quick Reference Card

```
CONTEXT RULES
─────────────────────────────────────────────────────────────────
Background    All fetch calls live here. Register listeners at top level.
              Use chrome.alarms, not setInterval. State in chrome.storage.

Content       Parse DOM only. No fetch. Send messages to background.
              Isolated world: page JS is invisible to you.

Popup         Transient. Call storeReady() before render.
              No fetch. No assumptions about async completing.

Options       Long-lived page. Can fetch but route through background
              for consistency and testability.

MESSAGING
─────────────────────────────────────────────────────────────────
Types         shared/messages.ts — discriminated union, never raw strings
Async reply   return true in onMessage listener (keeps channel open)
Error shape   { ok: false, error: string } — always typed AppResponse

STORAGE
─────────────────────────────────────────────────────────────────
Persist data  chrome.storage.local
Sync devices  chrome.storage.sync (5KB item limit, 100KB total)
Session only  chrome.storage.session
Never         localStorage from background or content scripts

PRODUCT EXTRACTION ORDER
─────────────────────────────────────────────────────────────────
1. JSON-LD   <script type="application/ld+json"> with @type Product
2. Open Graph  meta[property="og:title"], product:price:amount
3. CSS selectors  site-specific fallback in SITE_SELECTORS map

BUILD
─────────────────────────────────────────────────────────────────
Plugin        @vitejs/plugin-react (Babel) — NOT react-swc
Manifest      defineManifest in manifest.config.ts
HMR           CRXJS handles content script and popup HMR automatically

ANTI-PATTERNS
─────────────────────────────────────────────────────────────────
fetch in content script     CORS will block it
fetch in popup              CSP + transient lifecycle
setInterval in background   Killed when worker sleeps
Listener inside async       May never be registered
module-level mutable state  Lost on worker restart
localStorage in background  Not accessible from service worker
Radix primitives directly   Use design-system wrappers
```
