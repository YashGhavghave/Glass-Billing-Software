import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { BillDisplay } from '@/components/billing/bill-display';
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

export default async function BillPage({ params }: { params: { orderId: string } }) {
  const order: FullOrder | null = await prisma.order.findUnique({
    where: { orderNumber: params.orderId },
    include: {
      customer: true,
      project: true,
      quote: {
        include: {
            items: {
                include: {
                    design: true
                }
            }
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <BillDisplay order={order} />
  );
}
