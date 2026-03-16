# Frontend Package

React 18 + Next.js (App Router) + TypeScript + Tailwind + Radix. Design-system-first.

**Status**: Auth flow (login/register) and product management dashboard (list/detail/create/update/archive) implemented. Design system has 8 primitives + tokens. Storybook configured with MSW mocks. Zustand auth store with persist.

## STRUCTURE

```
src/
  app/
    (auth)/          # Route group: login, register (client-side forms)
    (dashboard)/     # Route group: products list/detail (server components)
  features/
    auth/            # LoginForm, RegisterForm, schemas, utils
    products/        # ProductCard, ProductDetail, ProductCreateModal, ProductUpdateModal,
                    #   ArchiveConfirmDialog, ProductListClient, ProductDetailClient,
                    #   EmptyState, schemas, formatters
  stores/            # Zustand stores (auth.store.ts)
  lib/
    api/             # server.ts (SSR fetch), client.ts (browser axios)
    env.ts           # API base URL resolution (server vs browser)
design-system/
  primitives/        # Button, Input, Label, Card, Toast, Dialog, AlertDialog, Toaster (Radix wrappers)
  tokens/            # colors.css, spacing.css, typography.css
  utils/             # cn.ts (class merge), use-toast.ts (pub/sub toast hook)
  index.ts           # Barrel export — ONLY import from here
```

## RENDERING PATTERN

| Route Group | Rendering | Data Fetching | Auth |
|---|---|---|---|
| `(auth)/*` | Client components | react-query mutations via api-client hooks | `AuthProviders` (QueryClient) |
| `(dashboard)/*` | Server components | `serverApiFetch` with cookie forwarding | `AuthGuard` (client redirect) |

## KEY CONVENTIONS

- **Design system first**: Never use Radix primitives directly. Import from `design-system/index.ts`.
- **Token-based styling**: Use CSS custom properties from `design-system/tokens/`. No hardcoded colors/spacing.
- **Feature boundaries**: Each feature owns its components, schemas, and utils. No cross-feature imports.
- **Zod schemas**: Auth validation uses local Zod schemas (`features/auth/schemas/`). API types come from `@findog/api-client`.
- **No `any`**: Strict TypeScript. Use `z.infer<>` for form types, generated types for API responses.
- **Server actions**: Use `safeParse` not `parse` in Server Actions / server-side validation.

## API INTEGRATION

- **Browser**: `src/lib/api/client.ts` wraps axios with token headers. Used by react-query hooks from `@findog/api-client`.
- **Server (SSR)**: `src/lib/api/server.ts` uses native `fetch` with cookie forwarding + `Authorization` header injection. Returns typed `ApiResponse<T>`.
- **Env resolution**: `src/lib/env.ts` resolves `API_BASE_URL` (server) vs `NEXT_PUBLIC_API_BASE_URL` (browser) with fallback logic.

## STORES

Zustand with selective middleware:

| Store | Middleware | Notes |
|---|---|---|
| `auth.store` | `persist` (localStorage) | Token sync to cookie for SSR. Hydration guard. |

## TESTING

- **Jest**: `design-system/primitives/*.test.tsx` + `features/auth/schemas/*.test.ts`
- **Storybook**: MSW-backed stories for auth forms + product components
- **Config**: `jest.config.ts` scopes `testMatch` to design-system + auth schemas (expand as needed)
- **Note**: `src/stores/auth.store.test.ts` exists but may be outside current `testMatch` scope

## ANTI-PATTERNS

- No direct Radix primitive usage (only through `design-system` wrappers)
- No client-side data fetching in Server Components
- No Server Component imports inside Client Components
- No CSS class selectors in E2E tests (use `data-testid`)
- No duplicate types — use generated `@findog/api-client` types
- No `localStorage` reads during SSR (hydration guard in auth store)

## COMMANDS

```bash
pnpm --filter frontend dev           # Dev server (port 8002)
pnpm --filter frontend build         # Production build
pnpm --filter frontend test          # Jest tests
pnpm --filter frontend storybook     # Storybook dev
pnpm --filter frontend storybook:build  # Build storybook
```

## REFERENCE

Full conventions: `docs/architecture/frontend.md`
