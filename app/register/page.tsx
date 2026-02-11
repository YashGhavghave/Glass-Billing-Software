'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { registerUser, type RegisterState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/layout/logo';

export default function RegisterPage() {
  const router = useRouter();
  const initialState: RegisterState = { message: undefined, errors: {}, success: false };
  const [state, dispatch] = useFormState(registerUser, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Registration Successful',
        description: 'You can now log in with your new account.',
      });
      router.push('/login');
    } else if (state.message && Object.keys(state.errors ?? {}).length > 0) {
      const description = state.errors?.database?.[0] || 'Please check the fields and try again.';
      toast({
        variant: 'destructive',
        title: state.message,
        description,
      });
    }
  }, [state, toast, router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
       <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <Link href="/" className="flex justify-center mb-4" aria-label="Home">
                <Logo />
            </Link>
          <CardTitle className="text-2xl font-headline">Create a Windoor Account</CardTitle>
          <CardDescription>Enter your information to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" name="firstName" placeholder="Max" required />
                 {state.errors?.firstName && <p className="text-xs text-destructive">{state.errors.firstName.join(', ')}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" name="lastName" placeholder="Robinson" required />
                 {state.errors?.lastName && <p className="text-xs text-destructive">{state.errors.lastName.join(', ')}</p>}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
               {state.errors?.email && <p className="text-xs text-destructive">{state.errors.email.join(', ')}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
               {state.errors?.password && <p className="text-xs text-destructive">{state.errors.password.join(', ')}</p>}
            </div>
            <SubmitButton />
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating Account...' : 'Create an account'}
        </Button>
    )
}
