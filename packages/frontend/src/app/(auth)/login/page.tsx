'use client';

import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@findog/design-system';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <LoginForm />
      </CardContent>

      <CardFooter>
        <p className="w-full text-center text-[length:--font-size-sm] text-[--color-text-muted]">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-[number:--font-weight-medium] text-[--color-brand-500] hover:text-[--color-brand-600] underline-offset-4 hover:underline"
          >
            Create account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
