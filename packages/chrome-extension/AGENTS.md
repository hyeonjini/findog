# Chrome Extension Package

React + TypeScript + Vite + CRXJS. Manifest V3.

**Status**: Skeleton. Background has `onInstalled` log only. Content script has minimal message listener. Popup is static HTML. No TypeScript yet, no CRXJS config, no typed messages.

## MV3 CRITICAL RULES

- Service worker is **ephemeral** (~30s idle timeout). Never store state in module-level variables.
- ALL event listeners MUST be registered at **top level** of `background/index.ts` — never inside async callbacks or conditionals.
- Use `chrome.alarms` for periodic work, not `setInterval`. Alarms survive worker restarts.
- Persist intermediate state to `chrome.storage` before worker sleeps.

## FILE SUFFIXES

| Suffix | Purpose |
|---|---|
| `.handler.ts` | Receives message, performs work, returns response |
| `.service.ts` | Stateless logic (fetch, DOM parsing, transforms) |
| `.store.ts` | Zustand slice with `chrome.storage` adapter |

## MESSAGING

- All message types: discriminated unions in `shared/messages.ts` (single source of truth)
- Never use plain string literals for message types
- Content/popup send messages -> background handles -> returns response
- Always handle `sendResponse` async rejections

## CONTEXT CAPABILITIES

| Capability | Background | Content | Popup |
|---|---|---|---|
| `fetch()` to backend | YES | NO | NO |
| DOM access | NO | YES | Own popup DOM |
| `chrome.storage.local` | YES | YES | YES |
| `chrome.storage.session` | YES | NO | NO |
| `chrome.alarms` | YES | NO | NO |
| `localStorage` | NO | NO | YES (own origin) |

## API COMMUNICATION FLOW

```
popup/content -> chrome.runtime.sendMessage -> background -> fetch(backend) -> response
```

All API calls MUST route through background service worker. Never call backend from content script or popup.

## ANTI-PATTERNS

- `fetch()` in content script or popup (must go through background)
- `setInterval` in background (use `chrome.alarms`)
- Async listener registration (listeners must be synchronous top-level)
- Module-level mutable state in background worker
- `localStorage` from background or content scripts
- Retrying 4xx errors (only retry 429/5xx)
- `@vitejs/plugin-react-swc` (use standard React plugin)
- Plain string message types (use typed discriminated unions)

## BUILD

Target: CRXJS Vite plugin with `manifest.config.ts` + `vite.config.ts` (neither created yet).

## REFERENCE

Full conventions: `docs/architecture/chrome-extension.md`
