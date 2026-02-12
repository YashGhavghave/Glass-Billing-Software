'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Logo } from '@/components/layout/logo';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Project, Quote, User, Design as DbDesign, Order, QuoteItem } from '@prisma/client';


type FullOrder = Order & {
    customer: User | null;
    project: Project;
    quote: Quote & {
        items: (QuoteItem & {
            design: DbDesign;
        })[];
    };
};

interface BillDisplayProps {
    order: FullOrder;
}

export function BillDisplay({ order }: BillDisplayProps) {

  useEffect(() => {
    document.title = `Invoice - ${order.orderNumber.replace('ORD', 'INV')} - ${order.project.name}`;
  }, [order]);
  
  const handlePrint = () => {
    window.print();
  };

  const totalAmount = order.totalAmount;
  const totalQty = order.quote.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-background min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
        <div className="container flex h-14 items-center justify-between gap-4 px-4 md:px-6">
            <Button asChild variant="outline" size="sm">
                <Link href="/billing">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Billing
                </Link>
            </Button>
            <div className="flex items-center gap-2">
                <Button onClick={handlePrint} variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print / Save as PDF
                </Button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 md:p-8 print-area font-sans">
        <Card className="w-full max-w-4xl mx-auto print:shadow-none print:border-none">
          <CardHeader className="text-center space-y-1 p-4 sm:p-6 border-b">
            <h1 className="text-2xl font-bold font-headline tracking-wider">INVOICE</h1>
            <p className="text-sm text-muted-foreground font-semibold uppercase">{order.project.name}</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
              <div className="space-y-1">
                <p><strong>BILLED TO:</strong></p>
                <p>{order.customer?.firstName} {order.customer?.lastName}</p>
                <p>{order.project.siteAddress}</p>
                <p>{order.customer?.email}</p>
              </div>
              <div className="space-y-1 text-left md:text-right">
                <p><strong>Invoice No.:</strong> {order.orderNumber.replace('ORD', 'INV')}</p>
                <p><strong>Order No.:</strong> {order.orderNumber}</p>
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                <p><strong>Due Date:</strong> {new Date(order.deliveryDate || order.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="border">
                <TableHeader>
                  <TableRow>
                    <TableHead className="border-r">DESCRIPTION</TableHead>
                    <TableHead className="text-right border-r">QTY</TableHead>
                    <TableHead className="text-right border-r">RATE</TableHead>
                    <TableHead className="text-right">AMOUNT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.quote.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium border-r">{item.design.name}</TableCell>
                        <TableCell className="text-right border-r">{item.quantity}</TableCell>
                        <TableCell className="text-right border-r">{Number(item.unitPrice).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{Number(item.totalPrice).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold text-base border-r">TOTAL</TableCell>
                    <TableCell className="text-right font-bold text-base border-r">{totalQty}</TableCell>
                    <TableCell className="border-r"></TableCell>
                    <TableCell className="text-right font-bold text-base">{Number(order.quote.totalAmount).toFixed(2)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            
            <div className="mt-8 flex flex-col-reverse md:flex-row justify-between items-start gap-8">
                <div className="text-sm text-muted-foreground w-full md:w-1/2">
                    <p className="font-bold mb-2">Terms & Conditions</p>
                    <p>{order.quote.termsConditions || 'Payment is due within 30 days. All sales are final.'}</p>
                </div>
                <div className="w-full md:w-[350px] text-sm">
                    <div className="grid grid-cols-2 gap-2 py-2 border-b">
                        <span className="font-semibold">SUBTOTAL</span>
                        <span className="text-right font-semibold">{Number(order.quote.subtotal).toFixed(2)}</span>
                    </div>
                     <div className="grid grid-cols-2 gap-2 py-2 border-b">
                        <span className="font-semibold">DISCOUNT ({Number(order.quote.discountPercent)}%)</span>
                        <span className="text-right font-semibold">-{Number(order.quote.discountAmount).toFixed(2)}</span>
                    </div>
                     <div className="grid grid-cols-2 gap-2 py-2 border-b">
                        <span className="font-semibold">TAX ({Number(order.quote.taxPercent)}%)</span>
                        <span className="text-right font-semibold">{Number(order.quote.taxAmount).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-2 border-b bg-muted font-bold text-base">
                        <span className="font-semibold">TOTAL</span>
                        <span className="text-right font-semibold">{Number(totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-2 text-green-600">
                        <span className="font-semibold">PAID</span>
                        <span className="text-right font-semibold">{Number(order.paidAmount).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-2 border-t mt-2 pt-2 font-bold text-lg">
                        <span className="font-semibold">BALANCE DUE</span>
                        <span className="text-right font-semibold">{ (Number(totalAmount) - Number(order.paidAmount)).toFixed(2) }</span>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
