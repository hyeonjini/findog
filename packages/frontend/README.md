# Frontend

Next.js + TypeScript 기반 웹 클라이언트.

## Structure

```text
src/
  app/
    (auth)/         # login, register pages
    (dashboard)/    # products list/detail with AuthGuard + DashboardProviders
  features/
    auth/           # LoginForm, RegisterForm, schemas
    products/       # ProductCard, ProductDetail, ProductCreateModal,
                    # ProductUpdateModal, ArchiveConfirmDialog,
                    # ProductListClient, ProductDetailClient, EmptyState, schemas
  stores/           # auth.store.ts (Zustand + persist)
  lib/
    api/            # server.ts (SSR fetch), client.ts (browser axios)
    utils/          # parse-api-error.ts
    env.ts          # API base URL resolution
design-system/
  primitives/       # Button, Input, Label, Card, Toast, Dialog, AlertDialog, Toaster
  tokens/           # colors.css, spacing.css, typography.css
  utils/            # cn.ts, use-toast.ts
  index.ts          # Barrel export
```

## Commands

```bash
pnpm --filter frontend dev           # Dev server (port 8002)
pnpm --filter frontend build         # Production build
pnpm --filter frontend test          # Jest tests
pnpm --filter frontend storybook     # Storybook dev
```
