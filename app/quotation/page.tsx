
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useDesignStore } from '@/store/use-design-store';
import { createProjectAndQuote } from '@/app/actions/quotations';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/layout/logo';
import Link from 'next/link';

type State = {
  error?: string;
} | undefined;


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Saving Quotation...' : 'Save & Generate Quotation'}
        </Button>
    )
}

export default function QuotationPage() {
  const designs = useDesignStore(state => state.designs);
  const { toast } = useToast();

  const createQuoteWithDesigns = createProjectAndQuote.bind(null, designs);
  const [state, dispatch] = useFormState<State, FormData>(createQuoteWithDesigns, undefined);
  
  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Error creating quote',
        description: state.error,
      });
    }
  }, [state, toast]);


  if (designs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
          <Card className="w-full max-w-md text-center">
              <CardHeader>
                  <CardTitle>No Designs Found</CardTitle>
                  <CardDescription>You must create at least one window in the designer before generating a quotation.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Button asChild>
                      <Link href="/design">Back to Designer</Link>
                  </Button>
              </CardContent>
          </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <Link href="/" className="flex justify-center mb-4" aria-label="Home">
                    <Logo />
                </Link>
                <CardTitle className="text-2xl font-headline">Generate Quotation</CardTitle>
                <CardDescription>Enter customer details to finalize the estimate. This will create a new project and save the quotation.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={dispatch} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="partyName">Party Name</Label>
                        <Input
                            id="partyName"
                            name="name"
                            placeholder="Enter customer's name"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            name="phone"
                            placeholder="Enter customer's phone number"
                            required
                        />
                    </div>
                    <SubmitButton />
                     <Button variant="outline" asChild className="w-full">
                        <Link href="/design">Back to Designer</Link>
                    </Button>
                    {state?.error && <p className="text-sm text-destructive text-center">{state.error}</p>}
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
