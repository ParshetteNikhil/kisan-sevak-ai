'use client';

import type { ReactNode } from 'react';
import { LogIn, Lock } from 'lucide-react';
import { useAuth } from '@/context/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Wraps features that call the AI or save shared data. Signed-out visitors
 * see a sign-in prompt instead of a form that would fail on submit.
 */
export function SignInRequired({ children, feature }: { children: ReactNode; feature?: string }) {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (!user) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Sign in to continue</CardTitle>
          <CardDescription>
            {feature ? `${feature} is available to signed-in users.` : 'This feature is available to signed-in users.'}{' '}
            It&apos;s free — use your Google account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => signInWithGoogle()} className="w-full">
            <LogIn className="mr-2 h-4 w-4" /> Sign in with Google
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
