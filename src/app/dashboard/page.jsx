import { PublicLayout } from '@/components/layout/public-layout';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser } from '@/lib/auth-session';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const userId = user.id;

  const [orders, payments, inventoryLogs] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: userId },
      include: { project: true },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    }).catch(() => []),
    prisma.payment.findMany({
      where: { order: { customerId: userId } },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }).catch(() => []),
    prisma.inventoryTransaction.findMany({
      where: { order: { customerId: userId } },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }).catch(() => []),
  ]);

  const totalOrderAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const totalPaidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <PublicLayout>
      <section className="py-12 sm:py-16">
        <div className="container px-4 md:px-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">My Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Welcome back, {user.firstName || user.email}. Track your inventory usage and order progress.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Total Orders</CardDescription>
                <CardTitle className="text-2xl">{orders.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Total Order Value</CardDescription>
                <CardTitle className="text-2xl">{totalOrderAmount.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Total Paid</CardDescription>
                <CardTitle className="text-2xl">{totalPaidAmount.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">My Orders</CardTitle>
                <CardDescription>Latest order tracking updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.length ? (
                  orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between border rounded-md p-3">
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{order.project?.name || 'Project'}</p>
                      </div>
                      <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>{order.status}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No orders found for your account yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Inventory Tracking</CardTitle>
                <CardDescription>Recent material movement linked to your orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {inventoryLogs.length ? (
                  inventoryLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between border rounded-md p-3">
                      <div>
                        <p className="font-medium">{log.type} · {log.itemType}</p>
                        <p className="text-sm text-muted-foreground">{log.order?.orderNumber || 'No order ref'}</p>
                      </div>
                      <span className="text-sm font-medium">{Number(log.quantity).toFixed(2)} {log.unit}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No inventory movement recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
