'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Logo } from '@/components/layout/logo';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Design } from '@/lib/types';

type PartyInfo = {
  name: string;
  phone: string;
  date: string;
  billNo: string;
};

interface ProjectQuotationProps {
    partyInfo: PartyInfo;
    designs: Design[];
}

export function ProjectQuotation({ partyInfo, designs }: ProjectQuotationProps) {
  
  const calculateArea = (width: number, height: number) => {
    // Assuming mm, converting to sq feet
    const widthInches = width / 25.4;
    const heightInches = height / 25.4;
    return (widthInches * heightInches) / 144;
  };

  const totalQty = designs.length;
  let totalArea = 0;
  let totalAmount = 0;

  designs.forEach(design => {
    const area = calculateArea(design.parameters.width, design.parameters.height);
    const rate = design.rate || 360;
    const amount = area * rate;
    totalArea += area;
    totalAmount += amount;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
        <div className="container flex h-14 items-center justify-between gap-4 px-4 md:px-6">
            <Button asChild variant="outline" size="sm">
                <Link href="/quotations">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Quotations
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
            <h1 className="text-2xl font-bold font-headline tracking-wider">ESTIMATE</h1>
            <p className="text-sm text-muted-foreground font-semibold">ALUMINIUM 1.2MM POWDER COATED WHITE 18/60 SERIES WITH BLACK TINTED GLASS</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
              <div className="space-y-1">
                <p><strong>PARTY NAME:</strong> {partyInfo.name}</p>
                <p><strong>PHONE NO:</strong> {partyInfo.phone}</p>
              </div>
              <div className="space-y-1 text-left md:text-right">
                <p><strong>Date:</strong> {partyInfo.date}</p>
                <p><strong>Bill No.:</strong> {partyInfo.billNo}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
                <Table className="border">
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[50px] border-r">SR NO.</TableHead>
                    <TableHead className="border-r">PARTICULAR</TableHead>
                    <TableHead className="text-right border-r">WIDTH (mm)</TableHead>
                    <TableHead className="text-right border-r">HEIGHT (mm)</TableHead>
                    <TableHead className="text-right border-r">QTY</TableHead>
                    <TableHead className="text-right border-r">AREA (sq.ft)</TableHead>
                    <TableHead className="text-right border-r">RATE</TableHead>
                    <TableHead className="text-right">AMOUNT</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {designs.map((design, index) => {
                    const area = calculateArea(design.parameters.width, design.parameters.height);
                    const rate = design.rate || 360;
                    const amount = area * rate;
                    return (
                        <TableRow key={design.id}>
                        <TableCell className="border-r">{index + 1}</TableCell>
                        <TableCell className="font-medium border-r">{design.name}</TableCell>
                        <TableCell className="text-right border-r">{design.parameters.width}</TableCell>
                        <TableCell className="text-right border-r">{design.parameters.height}</TableCell>
                        <TableCell className="text-right border-r">1</TableCell>
                        <TableCell className="text-right border-r">{area.toFixed(2)}</TableCell>
                        <TableCell className="text-right border-r">{rate.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{amount.toFixed(2)}</TableCell>
                        </TableRow>
                    );
                    })}
                </TableBody>
                <TableFooter>
                    <TableRow>
                    <TableCell colSpan={4} className="font-bold text-base border-r">TOTAL</TableCell>
                    <TableCell className="text-right font-bold text-base border-r">{totalQty}</TableCell>
                    <TableCell className="text-right font-bold text-base border-r">{totalArea.toFixed(2)}</TableCell>
                    <TableCell className="border-r"></TableCell>
                    <TableCell className="text-right font-bold text-base">{totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                </TableFooter>
                </Table>
            </div>
            
            <div className="mt-8 flex flex-col items-stretch md:items-end">
                <div className="w-full md:w-[450px] text-sm">
                    <div className="grid grid-cols-2 gap-2 py-2 border-b">
                        <span className="font-semibold">TOTAL</span>
                        <span className="text-right font-semibold">{totalAmount.toFixed(2)}</span>
                    </div>
                     <div className="grid grid-cols-2 gap-2 py-2 border-b">
                        <span className="font-semibold">CARTING</span>
                        <span className="text-right font-semibold">0.00</span>
                    </div>
                     <div className="grid grid-cols-2 gap-2 py-2 border-b font-bold">
                        <span className="font-semibold">TOTAL</span>
                        <span className="text-right font-semibold">{totalAmount.toFixed(2)}</span>
                    </div>
                     <div className="grid grid-cols-2 gap-2 py-2 border-b">
                        <span className="font-semibold">DISCOUNT</span>
                        <span className="text-right font-semibold">0.00</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-2 border-b font-bold text-base">
                        <span className="font-semibold">TOTAL</span>
                        <span className="text-right font-semibold">{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-2">
                        <span className="font-semibold">ADVANCE</span>
                        <span className="text-right font-semibold">0.00</span>
                    </div>
                </div>
            </div>

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
