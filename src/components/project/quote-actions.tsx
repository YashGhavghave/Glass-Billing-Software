'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { confirmQuote, rejectQuote } from '@/app/actions/quotations';
import { CheckCircle, XCircle } from 'lucide-react';
import { Quote } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';

interface QuoteActionsProps {
  quote: Quote;
}

export function QuoteActions({ quote }: QuoteActionsProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmQuote(quote.id);
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        toast({
          title: 'Success',
          description: result.message,
        });
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectQuote(quote.id);
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        toast({
          title: 'Quote Rejected',
          description: result.message,
        });
      }
    });
  };
  
  const isActionable = quote.status === 'DRAFT' || quote.status === 'SENT' || quote.status === 'VIEWED';

  if (!isActionable) {
    return null;
  }

  return (
    <div className="flex gap-2 mt-4">
      <Button 
        size="sm" 
        className="w-full" 
        onClick={handleConfirm}
        disabled={isPending}
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        {isPending ? 'Confirming...' : 'Confirm'}
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="w-full"
        onClick={handleReject}
        disabled={isPending}
      >
        <XCircle className="mr-2 h-4 w-4" />
        {isPending ? 'Rejecting...' : 'Reject'}
      </Button>
    </div>
  );
}
