"use client";

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/app/actions/auth';

const initialState = { success: false, message: undefined, errors: {} };

export function ProfileForm({ user }) {
  const [state, dispatch] = useFormState(updateProfile, initialState);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Profile updated', description: state.message || 'Changes saved.' });
      router.refresh();
    } else if (state.message && Object.keys(state.errors ?? {}).length > 0) {
      const description = state.errors?.database?.[0] || 'Please fix the form and try again.';
      toast({ variant: 'destructive', title: state.message, description });
    }
  }, [state, toast, router]);

  return (
    <form action={dispatch} className="grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" defaultValue={user.firstName || ''} required />
          {state.errors?.firstName && <p className="text-xs text-destructive">{state.errors.firstName.join(', ')}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" defaultValue={user.lastName || ''} required />
          {state.errors?.lastName && <p className="text-xs text-destructive">{state.errors.lastName.join(', ')}</p>}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={user.phone || ''} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="avatar">Avatar URL</Label>
        <Input id="avatar" name="avatar" defaultValue={user.avatar || ''} placeholder="https://..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" defaultValue={user.timezone || ''} placeholder="Asia/Kolkata" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="language">Language</Label>
          <Input id="language" name="language" defaultValue={user.language || 'en'} placeholder="en" />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Profile'}
    </Button>
  );
}
