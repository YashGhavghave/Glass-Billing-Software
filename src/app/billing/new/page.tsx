'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/layout/logo';
import { useToast } from '@/hooks/use-toast';

export default function NewBillingPage() {
  const [orderId, setOrderId] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      router.push(`/billing/${orderId.trim()}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Order ID Required',
        description: 'Please enter an Order ID to generate a bill.',
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="flex justify-center mb-4" aria-label="Home">
            <Logo />
          </Link>
          <CardTitle className="text-2xl font-headline">Generate Bill</CardTitle>
          <CardDescription>
            Enter an Order ID to fetch details and generate a bill.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., ORD-2024-07-1234"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Generate Bill
            </Button>
            <Button variant="outline" asChild className="w-full">
                <Link href="/billing">Back to Billing</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
