import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/layout/public-layout';
import { Package, PlusCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import prisma from '@/lib/prisma';
import { Project, Order, User } from '@prisma/client';
import { Input } from '@/components/ui/input';

type OrderWithProjectAndCustomer = Order & {
  project: Project;
  customer: User | null;
};

export default async function OrdersPage({ searchParams }: { searchParams?: { o?: string; }; }) {
  const oQuery = searchParams?.o || '';

  const recentOrders: OrderWithProjectAndCustomer[] = await prisma.order.findMany({
     where: {
      OR: [
        { orderNumber: { contains: oQuery, mode: 'insensitive' } },
        { project: { name: { contains: oQuery, mode: 'insensitive' } } },
        { customer: { firstName: { contains: oQuery, mode: 'insensitive' } } },
        { customer: { lastName: { contains: oQuery, mode: 'insensitive' } } },
      ],
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      project: true,
      customer: true,
    },
  }).catch(() => []);

  return (
    <PublicLayout>
        <section id="orders" className="py-12 sm:py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">Orders</h2>
                <p className="mt-2 text-lg text-muted-foreground">Track and manage all your customer orders.</p>
              </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <form action="/orders" className="w-full max-w-sm">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input name="o" placeholder="Search by order #, project, or customer..." className="pl-8" defaultValue={oQuery}/>
                        </div>
                        </form>
                         <Button disabled>
                            <PlusCircle className="mr-2" /> Add Order
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentOrders.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {recentOrders.map((order) => (
                        <Card key={order.id} className="flex flex-col hover:shadow-md transition-shadow">
                            <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="font-headline">{order.project.name}</CardTitle>
                                <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>{order.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground pt-1">{order.orderNumber}</p>
                            </CardHeader>
                            <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">
                                {order.customer?.firstName} {order.customer?.lastName}
                            </p>
                            <p className="text-2xl font-semibold mt-2">
                                {Number(order.totalAmount).toFixed(2)}
                            </p>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full" variant="outline">
                                    <Link href={`/billing/${order.orderNumber}`}>
                                        <Package className="mr-2 h-4 w-4" /> View Order Details
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                        ))}
                    </div>
                    ) : (
                     <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Orders Found</h3>
                        <p className="mt-1 text-sm">
                            {oQuery ? `No results for "${oQuery}".` : "There are no orders to display."}
                        </p>
                        <p className="mt-1 text-sm">Orders are created automatically when a quote is confirmed.</p>
                     </div>
                    )}
                </CardContent>
            </Card>
          </div>
        </section>
    </PublicLayout>
  );
}
