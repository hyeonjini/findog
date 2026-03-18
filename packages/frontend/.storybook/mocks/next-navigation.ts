/**
 * Mock for `next/navigation` used by Storybook's react-vite framework.
 *
 * Next.js router hooks require the App Router runtime context which is
 * absent in Storybook. This module provides no-op stubs so feature
 * components that import `useRouter`, `usePathname`, etc. can render
 * without throwing.
 */

const noop = () => {};

export function useRouter() {
  return {
    push: noop,
    replace: noop,
    refresh: noop,
    back: noop,
    forward: noop,
    prefetch: noop,
  };
}

export function usePathname() {
  return '/';
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function useParams() {
  return {};
}

export function redirect() {
  return undefined;
}

export function notFound() {
  return undefined;
}
