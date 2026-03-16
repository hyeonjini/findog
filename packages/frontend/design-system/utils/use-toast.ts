'use client';

import { useState, useEffect, useCallback } from 'react';

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

type ToastListener = (options: ToastOptions | null) => void;
const listeners: Set<ToastListener> = new Set();

function publish(options: ToastOptions | null) {
  listeners.forEach(fn => fn(options));
}

// Called from product forms: const { toast } = useToast(); toast({ title: 'Done' })
export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    publish(options);
  }, []);
  return { toast };
}

// Used internally by Toaster component only
export function useToastState() {
  const [current, setCurrent] = useState<(ToastOptions & { id: number }) | null>(null);

  useEffect(() => {
    function handler(options: ToastOptions | null) {
      if (options === null) {
        setCurrent(null);
      } else {
        setCurrent({ ...options, id: Date.now() });
        setTimeout(() => setCurrent(null), 5000);
      }
    }
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const dismiss = useCallback(() => publish(null), []);
  return { current, dismiss };
}
