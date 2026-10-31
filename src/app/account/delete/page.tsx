'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, LogIn, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { deleteAccountAndData } from '@/lib/delete-account';

export default function DeleteAccountPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [done, setDone] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await deleteAccountAndData(user);
      setDone(true);
    } catch (error: any) {
      console.error('Account deletion failed', error);
      toast({
        variant: 'destructive',
        title: 'Account not deleted',
        description:
          error?.code === 'auth/popup-closed-by-user'
            ? 'Please confirm with Google to delete your account.'
            : 'Something went wrong. Please try again or email us.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl space-y-6 p-4 pt-6 md:p-8">
      <h1 className="text-3xl font-bold font-headline">Delete your Kisaan Sevak account</h1>

      <Card>
        <CardHeader>
          <CardTitle>What gets deleted</CardTitle>
          <CardDescription>Deletion is immediate and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="ml-5 list-disc space-y-1">
            <li>Your profile (name, phone number, bio, role)</li>
            <li>All your marketplace listings</li>
            <li>Your tasks, schedules, farm records and inventory</li>
            <li>Your AI assistant conversations</li>
            <li>Your sign-in account</li>
          </ul>
          <p className="pt-2 text-muted-foreground">
            Nothing is kept after deletion. See our <Link href="/privacy" className="text-primary underline">privacy policy</Link>.
          </p>
        </CardContent>
      </Card>

      {done ? (
        <Card>
          <CardContent className="pt-6">
            <p className="font-medium">Your account and data have been deleted.</p>
            <p className="text-sm text-muted-foreground">Thank you for using Kisaan Sevak.</p>
          </CardContent>
        </Card>
      ) : loading ? null : !user ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm">Sign in with the Google account you want to delete.</p>
            <Button onClick={() => signInWithGoogle()}>
              <LogIn className="mr-2 h-4 w-4" /> Sign in with Google
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" /> Delete {user.email}
            </CardTitle>
            <CardDescription>Type DELETE to confirm. Google will ask you to confirm it&apos;s you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmation</Label>
              <Input id="confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" autoComplete="off" />
            </div>
            <Button variant="destructive" disabled={confirmText !== 'DELETE' || isDeleting} onClick={handleDelete}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Permanently delete my account
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
