'use client';

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
} from './Toast';
import { useToastState } from '../utils/use-toast';

export function Toaster() {
  const { current, dismiss } = useToastState();

  return (
    <ToastProvider>
      {current && (
        <Toast
          open={true}
          onOpenChange={(open) => { if (!open) dismiss(); }}
          variant={current.variant ?? 'default'}
        >
          <ToastTitle>{current.title}</ToastTitle>
          {current.description && (
            <ToastDescription>{current.description}</ToastDescription>
          )}
        </Toast>
      )}
      <ToastViewport />
    </ToastProvider>
  );
}
