import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/layout/public-layout';
import { Receipt, PlusCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import prisma from '@/lib/prisma';
import { Project, Order, User, Payment } from '@prisma/client';
import { Input } from '@/components/ui/input';

type OrderWithProjectAndCustomer = Order & {
  project: Project;
  customer: User | null;
};

type PaymentWithOrder = Payment & {
  order: OrderWithProjectAndCustomer;
}

export default async function BillingPage({ searchParams }: { searchParams?: { b?: string; }; }) {
  const bQuery = searchParams?.b || '';

  const recentPayments: PaymentWithOrder[] = await prisma.payment.findMany({
    where: {
      OR: [
        { order: { orderNumber: { contains: bQuery, mode: 'insensitive' }}},
        { order: { project: { name: { contains: bQuery, mode: 'insensitive' } } } },
        { transactionId: { contains: bQuery, mode: 'insensitive' } }
      ]
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      order: {
        include: {
          project: true,
          customer: true,
        }
      }
    }
  }).catch(() => []);
  
  const totalOrdersCount = await prisma.order.count().catch(() => 0);

  return (
    <PublicLayout>
        <section id="billing" className="py-12 sm:py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">Billing</h2>
                <p className="mt-2 text-lg text-muted-foreground">Manage invoices, payments, and view financial records.</p>
              </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <form action="/billing" className="w-full max-w-sm">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input name="b" placeholder="Search by order #, project, or transaction..." className="pl-8" defaultValue={bQuery}/>
                        </div>
                        </form>
                        {totalOrdersCount > 0 ? (
                            <Button asChild>
                            <Link href="/billing/new"><PlusCircle className="mr-2" /> Find Bill</Link>
                            </Button>
                        ) : (
                            <Button disabled title="Create an order to enable billing">
                            <PlusCircle className="mr-2" /> Find Bill
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {recentPayments.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {recentPayments.map((payment) => (
                        <Card key={payment.id} className="flex flex-col hover:shadow-md transition-shadow">
                            <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="font-headline">{payment.order.project.name}</CardTitle>
                                <Badge variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'}>{payment.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground pt-1">{payment.order.orderNumber}</p>
                            </CardHeader>
                            <CardContent className="flex-grow">
                             <p className="text-sm text-muted-foreground">
                                {payment.order.customer?.firstName} {payment.order.customer?.lastName}
                             </p>
                            <p className="text-2xl font-semibold mt-2">
                                {Number(payment.amount).toFixed(2)}
                            </p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" asChild>
                                    <Link href={`/billing/${payment.order.orderNumber}`}>
                                        <Receipt className="mr-2 h-4 w-4" /> View Bill
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                        ))}
                    </div>
                    ) : (
                        <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                            <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Bills Found</h3>
                            <p className="mt-1 text-sm">
                                {bQuery ? `No results for "${bQuery}".` : "No payment records are available."}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>
        </section>
    </PublicLayout>
  );
}
