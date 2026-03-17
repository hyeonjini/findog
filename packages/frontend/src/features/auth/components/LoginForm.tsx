'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@findog/design-system';
import { useLoginApiAuthLoginPost } from '@findog/api-client/endpoints/auth/auth';
import { loginSchema, type LoginInput } from '../schemas/login.schema';
import { useAuthStore } from '@/stores/auth.store';
import { parseApiError } from '@/lib/utils/parse-api-error';

export function LoginForm() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginInput, string>>
  >({});

  const login = useLoginApiAuthLoginPost({
    mutation: {
      onSuccess: (data) => {
        setTokens(data.access_token, data.refresh_token);
        router.push('/products');
      },
    },
  });

  const apiError = login.error ? parseApiError(login.error) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    login.reset();

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof LoginInput, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginInput;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    login.mutate({ data: result.data });
  }

  function handleChange(field: keyof LoginInput) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="login-form"
      noValidate
      className="flex flex-col gap-[--space-4]"
    >
      {apiError && (
        <div
          data-testid="login-api-error"
          role="alert"
          className="rounded-md border border-[--color-error-500] bg-[--color-error-500]/10 px-[--space-3] py-[--space-2] text-[length:--font-size-sm] text-[--color-error-500]"
        >
          {apiError}
        </div>
      )}

      <div className="flex flex-col gap-[--space-1]">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          data-testid="login-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange('email')}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={
            fieldErrors.email ? 'login-email-error' : undefined
          }
          className={
            fieldErrors.email
              ? 'border-[--color-error-500] focus-visible:ring-[--color-error-500]'
              : ''
          }
        />
        {fieldErrors.email && (
          <p
            id="login-email-error"
            data-testid="login-email-error"
            className="text-[length:--font-size-sm] text-[--color-error-500]"
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-[--space-1]">
        <Label htmlFor="login-password">Password</Label>
        <div style={{ position: 'relative' }}>
          <Input
            id="login-password"
            data-testid="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange('password')}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={
              fieldErrors.password ? 'login-password-error' : undefined
            }
            className={
              fieldErrors.password
                ? 'border-[--color-error-500] focus-visible:ring-[--color-error-500]'
                : ''
            }
            style={{ paddingRight: '48px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: '12px',
              padding: '0',
            }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {fieldErrors.password && (
          <p
            id="login-password-error"
            data-testid="login-password-error"
            className="text-[length:--font-size-sm] text-[--color-error-500]"
          >
            {fieldErrors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        data-testid="login-submit"
        disabled={login.isPending}
        className="w-full"
      >
        {login.isPending ? 'Signing in\u2026' : 'Sign in'}
      </Button>
    </form>
  );
}
