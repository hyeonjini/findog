# Frontend Architecture & Conventions

## Directory Structure

```
packages/frontend/
├── src/
│   ├── app/                    # Next.js App Router: routes, layouts, pages
│   │   ├── (auth)/             # Route group: unauthenticated pages
│   │   ├── (dashboard)/        # Route group: authenticated pages
│   │   ├── api/                # Route handlers (server-side only)
│   │   └── layout.tsx          # Root layout
│   ├── features/               # Vertical slices by domain
│   │   └── <feature>/
│   │       ├── components/     # Feature-scoped UI (not shared)
│   │       ├── hooks/          # Feature-scoped hooks
│   │       ├── schemas/        # Zod schemas for this feature
│   │       ├── stores/         # Feature-scoped Zustand stores
│   │       ├── actions/        # Server Actions for this feature
│   │       └── index.ts        # Barrel export (feature boundary only)
│   ├── components/             # Shared UI built on top of design-system
│   ├── lib/
│   │   ├── api/                # API client wrappers and fetchers
│   │   ├── env.ts              # Validated env vars (Zod)
│   │   └── utils.ts            # Pure utility functions
│   └── stores/                 # Global Zustand stores (auth, cart, etc.)
└── design-system/
    ├── primitives/             # Radix wrappers (Button, Dialog, etc.)
    ├── tokens/                 # CSS custom properties (colors, spacing, type)
    ├── components/             # Composed design-system components
    └── index.ts                # Single export point for design-system
```

**Rules:**
- Never import from `src/features/<A>/` inside `src/features/<B>/`. Cross-feature communication goes through shared stores or events.
- Barrel exports (`index.ts`) exist only at feature boundaries and `design-system/`. Never create them inside `src/components/` or `src/lib/`.
- `src/components/` contains only components that are used by 2+ features. Single-use UI belongs inside the feature.

---

## Next.js App Router Conventions

### Route Organization

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx              # Authenticated shell (sidebar, nav)
│   ├── products/
│   │   ├── page.tsx            # /products list
│   │   └── [id]/page.tsx       # /products/:id detail
│   └── settings/page.tsx
└── layout.tsx                  # Root layout (fonts, providers)
```

- Route groups `(name)` organize routes without affecting the URL.
- Every route group that requires auth gets its own `layout.tsx` with a session guard.
- Dynamic segments use `[param]` for single values, `[...slug]` for catch-all.
- Collocate `loading.tsx`, `error.tsx`, and `not-found.tsx` at the route level they handle.

### Server vs. Client Components

| Concern | Component type | Directive |
|---|---|---|
| Data fetching from DB / API | Server Component | none (default) |
| Interactive UI (onClick, useState) | Client Component | `'use client'` |
| Context providers | Client Component | `'use client'` |
| Static layout / shell | Server Component | none |
| Form with Server Action | Server Component + Client island | `'use client'` on the form |

**Rules:**
- Default to Server Components. Add `'use client'` only when the component needs browser APIs or React state.
- Never fetch data inside a Client Component. Pass data down as props from a Server Component parent.
- Keep `'use client'` boundaries as deep in the tree as possible. A single interactive button should not force its entire page to be a Client Component.
- Never import a Server Component into a Client Component. Pass Server Component output as `children` instead.

### Data Fetching

```tsx
// Server Component: fetch directly, no useEffect
async function ProductList() {
  const products = await getProducts(); // server-side fetcher in src/lib/api/
  return <ProductGrid items={products} />;
}

// Parallel fetching: avoid waterfall
async function ProductDetail({ id }: { id: string }) {
  const [product, priceHistory] = await Promise.all([
    getProduct(id),
    getPriceHistory(id),
  ]);
  return <Detail product={product} history={priceHistory} />;
}
```

- All server-side fetchers live in `src/lib/api/`. They call `@findog/api-client` and handle errors.
- Use `cache()` from React for request deduplication within a single render pass.
- Use `unstable_cache` from `next/cache` for cross-request caching with explicit tags.
- Revalidate via `revalidateTag()` inside Server Actions after mutations.
- Never use `useEffect` + `fetch` for initial data. That pattern belongs only to client-side polling or real-time updates.

### Layout Nesting

- Root `layout.tsx`: fonts, global CSS, top-level providers (QueryClient, ThemeProvider).
- Group `layout.tsx`: auth guards, shared navigation shells.
- Route `layout.tsx`: page-specific persistent UI (tabs, sidebars scoped to that section).
- Never put data fetching in a layout that would block the entire subtree. Use `Suspense` boundaries with `loading.tsx` instead.

---

## Design System Rules

### Radix UI Wrapping

**Never import from `@radix-ui/*` in feature code or `src/components/`.** All Radix primitives are wrapped in `design-system/primitives/` and re-exported from `design-system/index.ts`.

```tsx
// WRONG — direct Radix import in a feature
import * as Dialog from '@radix-ui/react-dialog';

// CORRECT — use the design-system wrapper
import { Dialog } from '@findog/design-system';
```

Wrappers in `design-system/primitives/` must:
- Forward all Radix props via `React.ComponentPropsWithoutRef`.
- Apply design tokens (not hardcoded values) for default styling.
- Export a single named export matching the Radix component name.

### Token Structure

Tokens are CSS custom properties defined in `design-system/tokens/`. Never use raw hex values or pixel literals in component styles.

```css
/* design-system/tokens/colors.css */
:root {
  --color-brand-500: #2563eb;
  --color-surface-default: #ffffff;
  --color-text-primary: #111827;
  --color-text-muted: #6b7280;
  --color-border-default: #e5e7eb;
}

/* design-system/tokens/spacing.css */
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-8: 2rem;
}

/* design-system/tokens/typography.css */
:root {
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --line-height-normal: 1.5;
}
```

### CVA + Slot Pattern

Use `class-variance-authority` (cva) for variant-driven components. Use Radix `Slot` to allow polymorphic rendering.

```tsx
// design-system/primitives/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-[--color-brand-500] text-white hover:bg-[--color-brand-600]',
        ghost: 'bg-transparent hover:bg-[--color-surface-hover]',
        destructive: 'bg-[--color-error-500] text-white',
      },
      size: {
        sm: 'h-8 px-3 text-[--font-size-sm]',
        md: 'h-10 px-4 text-[--font-size-base]',
        lg: 'h-12 px-6 text-[--font-size-lg]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ variant, size, asChild, className, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={buttonVariants({ variant, size, className })} {...props} />;
}
```

### Primitive vs. Component Decision

| Create a **primitive** when... | Create a **component** when... |
|---|---|
| Wrapping a Radix element with token-based defaults | Composing 2+ primitives into a reusable pattern |
| The API mirrors the underlying HTML element | The component has domain-agnostic business logic (e.g., `PriceTag`, `Badge`) |
| It needs `asChild` / polymorphic support | It has a fixed, opinionated layout |

---

## Zustand Conventions

### File Naming

- Global stores: `src/stores/camelCase.store.ts` (e.g., `auth.store.ts`, `cart.store.ts`)
- Feature stores: `src/features/<feature>/stores/camelCase.store.ts`

### Slice Pattern

When a store has more than 3 concerns, split into slices and combine:

```ts
// src/stores/slices/authSlice.ts
import type { StateCreator } from 'zustand';

export interface AuthSlice {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  clearAuth: () => set({ user: null, token: null }),
});

// src/stores/root.store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createCartSlice, type CartSlice } from './slices/cartSlice';

type RootStore = AuthSlice & CartSlice;

export const useRootStore = create<RootStore>()(
  devtools(
    persist(
      (...args) => ({
        ...createAuthSlice(...args),
        ...createCartSlice(...args),
      }),
      { name: 'findog-root' }
    ),
    { name: 'RootStore' }
  )
);
```

### Middleware Decision Matrix

| Middleware | When to use |
|---|---|
| `devtools` | Always. Every store, no exceptions. |
| `persist` | Auth tokens, cart state, user preferences. Never for server-fetched data. |
| `immer` | When state has nesting deeper than 2 levels or array mutations are frequent. |
| `subscribeWithSelector` | When a component needs to react to a specific slice of state without re-rendering on unrelated changes. |

### Selector Best Practices

```ts
import { useShallow } from 'zustand/react/shallow';

// WRONG — new object reference on every render
const { user, token } = useRootStore((s) => ({ user: s.user, token: s.token }));

// CORRECT — useShallow prevents unnecessary re-renders
const { user, token } = useRootStore(useShallow((s) => ({ user: s.user, token: s.token })));

// CORRECT — single primitive, no useShallow needed
const user = useRootStore((s) => s.user);
```

### Action Naming

Name actions as `'slice/action'` strings in devtools-compatible format:

```ts
set({ user }, false, 'auth/setUser');
set({ user: null, token: null }, false, 'auth/clearAuth');
```

---

## Zod Conventions

### File Naming

- `src/features/<feature>/schemas/camelCase.schema.ts`
- `src/lib/env.ts` for environment variable schemas

### Always Export the Inferred Type

```ts
// features/products/schemas/saveProduct.schema.ts
import { z } from 'zod';

export const saveProductSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  title: z.string().min(1).max(255),
  price: z.coerce.number().positive().optional(),
});

export type SaveProductInput = z.infer<typeof saveProductSchema>;
```

Never define a separate TypeScript interface that duplicates a Zod schema. The inferred type is the source of truth.

### Coercion Rules for FormData

`FormData` values are always strings. Use `z.coerce` for numeric and boolean fields:

```ts
const formSchema = z.object({
  price: z.coerce.number().positive(),
  inStock: z.coerce.boolean(),
  quantity: z.coerce.number().int().min(0),
});
```

Do not use `z.coerce` for string fields. It's unnecessary and masks type errors.

### Server Action Integration

```ts
// features/products/actions/saveProduct.action.ts
'use server';

import { saveProductSchema } from '../schemas/saveProduct.schema';

export async function saveProductAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const result = saveProductSchema.safeParse(raw);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      data: null,
    };
  }

  // proceed with result.data (fully typed)
  const product = await createProduct(result.data);
  return { errors: null, data: product };
}
```

- Always use `safeParse`, never `parse`, in Server Actions. Thrown Zod errors are not user-friendly.
- Return `flatten().fieldErrors` so the client can map errors to individual form fields.
- Never return raw Zod error objects to the client.

---

## TypeScript Style

### Naming Table

| Construct | Convention | Example |
|---|---|---|
| React component | PascalCase | `ProductCard`, `PriceHistory` |
| Custom hook | `use` + PascalCase | `useProductList`, `usePriceAlert` |
| Zustand store hook | `use` + PascalCase + `Store` | `useAuthStore`, `useCartStore` |
| Zod schema | camelCase + `Schema` | `saveProductSchema` |
| Inferred Zod type | PascalCase + `Input` or `Output` | `SaveProductInput` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_SAVED_PRODUCTS`, `API_BASE_URL` |
| TypeScript type alias | PascalCase | `ProductSummary`, `PricePoint` |
| TypeScript interface | PascalCase | `ProductRepository`, `AuthContext` |
| Enum | PascalCase (prefer `const` objects) | `ProductStatus.Active` |
| Server Action | camelCase + `Action` | `saveProductAction` |
| API fetcher | camelCase + verb | `getProduct`, `createProduct` |

### File Naming Per Type

| File type | Naming pattern |
|---|---|
| React component | `PascalCase.tsx` |
| Custom hook | `useCamelCase.ts` |
| Zustand store | `camelCase.store.ts` |
| Zod schema | `camelCase.schema.ts` |
| Server Action | `camelCase.action.ts` |
| Utility function | `camelCase.ts` |
| Test file | `<filename>.test.ts(x)` |
| Story file | `<ComponentName>.stories.tsx` |
| Type-only file | `camelCase.types.ts` |

### Barrel Exports

- Create `index.ts` only at feature boundaries (`src/features/<feature>/index.ts`) and `design-system/index.ts`.
- Never create barrel files inside `src/lib/`, `src/components/`, or nested feature subdirectories.
- Import from the barrel at the feature boundary, not from deep internal paths.

```ts
// WRONG — deep import from another feature
import { ProductCard } from '@/features/products/components/ProductCard';

// CORRECT — import from the feature boundary
import { ProductCard } from '@/features/products';
```

### General Rules

- Prefer `type` over `interface` for data shapes. Use `interface` only for extensible contracts (e.g., repository interfaces).
- Never use `any`. Use `unknown` and narrow with type guards.
- Enable `strict: true` in `tsconfig.json`. No exceptions.
- API response types come from `@findog/api-client`. Never redefine them locally.

---

## Storybook Conventions

### CSF3 Format

All stories use Component Story Format 3 with `satisfies Meta<typeof Component>`:

```tsx
// design-system/primitives/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Save Product' },
};

export const Disabled: Story = {
  args: { variant: 'primary', children: 'Save Product', disabled: true },
};
```

### Story Naming

Story names describe **state**, not actions:

```ts
// WRONG — action-oriented names
export const ClickButton: Story = {};
export const HoverState: Story = {};

// CORRECT — state-oriented names
export const Default: Story = {};
export const Disabled: Story = {};
export const Loading: Story = {};
export const WithIcon: Story = {};
export const DestructiveVariant: Story = {};
```

### Autodocs

- Enable `tags: ['autodocs']` only in `design-system/` stories.
- Feature component stories do not get autodocs. They exist for visual regression and interaction testing only.

### Interaction Testing with `play()` and `fn()`

```tsx
import { expect, fn, userEvent, within } from '@storybook/test';

export const SubmitsForm: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('URL'), 'https://example.com/product');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onSubmit).toHaveBeenCalledOnce();
  },
};
```

- Use `fn()` from `@storybook/test` (not `jest.fn()`) for spy functions in stories.
- `play()` tests run in the browser. Keep them focused on user interaction, not implementation details.
- Every interactive component in `design-system/` must have at least one story with a `play()` test.

---

## Testing

### Jest: Unit Tests

**What to test with Jest:**

| Target | What to assert |
|---|---|
| Zod schemas | Valid input passes, invalid input returns correct `fieldErrors` |
| Zustand stores | Actions mutate state correctly, selectors return expected values |
| Utility functions | Pure function output for given inputs |
| Custom hooks | State transitions via `renderHook` from `@testing-library/react` |
| Server Actions | Returns correct `errors`/`data` shape for valid and invalid input |

```ts
// features/products/schemas/saveProduct.schema.test.ts
import { saveProductSchema } from './saveProduct.schema';

describe('saveProductSchema', () => {
  it('accepts a valid product URL', () => {
    const result = saveProductSchema.safeParse({ url: 'https://example.com', title: 'Widget' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL', () => {
    const result = saveProductSchema.safeParse({ url: 'not-a-url', title: 'Widget' });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.url).toBeDefined();
  });
});
```

**Rules:**
- Test files live next to the file they test: `Button.tsx` + `Button.test.tsx`.
- Never test implementation details (internal state, private methods). Test behavior.
- Mock `@findog/api-client` at the module level in Jest config, not per-test.

### Playwright: E2E Tests

**What to test with Playwright:**

| Target | What to assert |
|---|---|
| Critical user journeys | Full flow from login to task completion |
| Cross-page state | Data persists across navigation |
| Auth-gated routes | Unauthenticated users are redirected |
| Form submission | Server Action processes and redirects correctly |

**Page Object Model:**

```ts
// e2e/pages/ProductsPage.ts
import type { Page } from '@playwright/test';

export class ProductsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/products');
  }

  async saveProduct(url: string) {
    await this.page.getByLabel('Product URL').fill(url);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async getProductCount() {
    return this.page.getByTestId('product-card').count();
  }
}

// e2e/specs/saveProduct.spec.ts
import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';

test('user can save a product from a URL', async ({ page }) => {
  const productsPage = new ProductsPage(page);
  await productsPage.goto();
  await productsPage.saveProduct('https://example.com/product/123');
  await expect(page.getByTestId('product-card')).toHaveCount(1);
});
```

**Rules:**
- One spec file per user journey. Never mix journeys in a single spec.
- Seed test data via API calls in `test.beforeEach`, not by clicking through the UI.
- Use `data-testid` attributes for E2E selectors. Never use CSS classes or implementation-specific selectors.
- Run Playwright against a real dev server with a seeded test database, not mocks.
- Store Page Objects in `e2e/pages/`. Store specs in `e2e/specs/`.

---

## Quick Reference Card

### Directory Rules
- `src/app/` — routes only, no business logic
- `src/features/<f>/` — vertical slice, barrel export at `index.ts`
- `src/components/` — shared UI used by 2+ features, no barrel
- `src/lib/` — pure utilities and API fetchers, no barrel
- `design-system/` — Radix wrappers + tokens, single `index.ts` export

### Component Rules
- Default: Server Component. Add `'use client'` only for interactivity.
- Never fetch in Client Components. Pass data as props.
- Never import Radix directly outside `design-system/primitives/`.
- Use `cva` for variants, `Slot` for polymorphism.
- Tokens via CSS vars only. No raw hex or px literals.

### Zustand Rules
- File: `camelCase.store.ts`
- `devtools` always. `persist` for auth/cart. `immer` for deep nesting.
- Multi-primitive selectors: wrap with `useShallow`.
- Action names: `'slice/action'` format.
- Slice pattern when store has 3+ concerns.

### Zod Rules
- File: `camelCase.schema.ts`
- Always export `z.infer<typeof schema>` as a named type.
- `z.coerce` for FormData numerics/booleans only.
- Server Actions: `safeParse` + `flatten().fieldErrors`. Never `parse`.

### TypeScript Rules
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Stores: `camelCase.store.ts`
- Schemas: `camelCase.schema.ts`
- Constants: `SCREAMING_SNAKE_CASE`
- Barrel exports at feature boundaries only.
- No `any`. No local redefinition of `@findog/api-client` types.

### Storybook Rules
- CSF3: `satisfies Meta<typeof Component>`
- Story names = state descriptions, not actions.
- `autodocs` in `design-system/` only.
- Interactive components need at least one `play()` test.
- Use `fn()` from `@storybook/test`, not `jest.fn()`.

### Testing Rules
- Jest: schemas, stores, hooks, utils, Server Actions.
- Playwright: one spec per journey, Page Object Model, seed via API.
- Test files colocated with source files.
- E2E selectors: `data-testid` only.
- Never test implementation details.
