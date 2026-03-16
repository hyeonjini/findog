# Design System

Radix primitive를 직접 노출하지 않고 wrapper 컴포넌트로 제공한다.

## Primitives

Button, Input, Label, Card, Toast, Dialog, AlertDialog, Toaster

## Utilities

- `cn.ts`: class merge helper (clsx + tailwind-merge)
- `use-toast.ts`: pub/sub toast hook

## Tokens

- `colors.css`: color custom properties
- `spacing.css`: spacing scale
- `typography.css`: font size/weight/line-height

## Rule

Import only from `design-system/index.ts`. Never import Radix primitives directly.
