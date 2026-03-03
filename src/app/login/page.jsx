"use client";

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/layout/logo';
import { useToast } from '@/hooks/use-toast';
import { loginUser } from '@/app/actions/auth';

export default function LoginPage() {
  const { toast } = useToast();
  const initialState = { message: undefined, errors: {}, success: false };
  const [state, dispatch] = useFormState(loginUser, initialState);

  useEffect(() => {
    if (state.message && Object.keys(state.errors ?? {}).length > 0) {
      const description = state.errors?.database?.[0] || 'Please check your credentials and try again.';
      toast({
        variant: 'destructive',
        title: state.message,
        description,
      });
    }
  }, [state, toast]);

    return (<div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="flex justify-center mb-4" aria-label="Home">
              <Logo />
          </Link>
          <CardTitle className="text-2xl font-headline">Login to Windoor</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required/>
              {state.errors?.email && <p className="text-xs text-destructive">{state.errors.email.join(', ')}</p>}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline">
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required/>
              {state.errors?.password && <p className="text-xs text-destructive">{state.errors.password.join(', ')}</p>}
            </div>
            <SubmitButton />
            <Button type="button" variant="outline" className="w-full">
              Login with Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>);
}

    function SubmitButton() {
      const { pending } = useFormStatus();
      return (<Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Logging in...' : 'Login'}
        </Button>);
    }
