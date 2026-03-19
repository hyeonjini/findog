'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@findog/design-system';
import { useRegisterApiAuthRegisterPost } from '@findog/api-client/endpoints/auth/auth';
import { registerSchema, type RegisterInput } from '../schemas/register.schema';
import { parseApiError } from '@/lib/utils/parse-api-error';

export function RegisterForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterInput>({
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterInput, string>>
  >({});

  const register = useRegisterApiAuthRegisterPost({
    mutation: {
      onSuccess: () => {
        router.push('/login?registered=1');
      },
    },
  });

  const apiError = register.error ? parseApiError(register.error) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    register.reset();

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof RegisterInput, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RegisterInput;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    register.mutate({ data: result.data });
  }

  function handleChange(field: keyof RegisterInput) {
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
      data-testid="register-form"
      noValidate
      className="flex flex-col gap-[--space-4]"
    >
      {apiError && (
        <div
          data-testid="register-api-error"
          role="alert"
          className="rounded-md border border-[--color-error-500] bg-[--color-error-500]/10 px-[--space-3] py-[--space-2] text-[length:--font-size-sm] text-[--color-error-500]"
        >
          {apiError}
        </div>
      )}

      <div className="flex flex-col gap-[--space-1]">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          data-testid="register-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange('email')}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={
            fieldErrors.email ? 'register-email-error' : undefined
          }
          className={
            fieldErrors.email
              ? 'border-[--color-error-500] focus-visible:ring-[--color-error-500]'
              : ''
          }
        />
        {fieldErrors.email && (
          <p
            id="register-email-error"
            data-testid="register-email-error"
            className="text-[length:--font-size-sm] text-[--color-error-500]"
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-[--space-1]">
        <Label htmlFor="register-password">Password</Label>
        <div style={{ position: 'relative' }}>
          <Input
            id="register-password"
            data-testid="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange('password')}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={
              fieldErrors.password ? 'register-password-error' : undefined
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
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
          >
            {showPassword ? '숨기기' : '보기'}
          </button>
        </div>
        {fieldErrors.password && (
          <p
            id="register-password-error"
            data-testid="register-password-error"
            className="text-[length:--font-size-sm] text-[--color-error-500]"
          >
            {fieldErrors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        data-testid="register-submit"
        disabled={register.isPending}
        className="w-full"
      >
        {register.isPending ? 'Creating account\u2026' : 'Create account'}
      </Button>
    </form>
  );
}
