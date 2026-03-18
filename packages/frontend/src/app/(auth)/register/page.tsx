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
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Sign up to start tracking your products.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <RegisterForm />
      </CardContent>

      <CardFooter>
        <p className="w-full text-center text-[length:--font-size-sm] text-[--color-text-muted]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-[number:--font-weight-medium] text-[--color-brand-500] hover:text-[--color-brand-600] underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
