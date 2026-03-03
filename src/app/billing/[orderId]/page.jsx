import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { BillDisplay } from '@/components/billing/bill-display';
export default async function BillPage({ params }) {
    const order = await prisma.order.findUnique({
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
    return (<BillDisplay order={order}/>);
}
