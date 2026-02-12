
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { Design } from '@/lib/types';
import { QuoteStatus, OrderStatus, UserRole } from '@prisma/client';

// Action to confirm a quote and create an order
export async function confirmQuote(quoteId: string) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        project: {
          include: {
            customer: true,
          }
        },
      },
    });

    if (!quote || !quote.project || !quote.project.customer) {
      throw new Error('Quote or associated project/customer not found.');
    }
    
    if (quote.status === 'CONVERTED') {
      return { message: 'Quote already converted to order.' };
    }

    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.CONVERTED },
    });

    const orderNumber = `ORD-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    await prisma.order.create({
      data: {
        orderNumber,
        projectId: quote.projectId,
        quoteId: quote.id,
        customerId: quote.project.customerId,
        createdById: quote.createdById, // Added required field
        status: OrderStatus.CONFIRMED,
        totalAmount: quote.totalAmount,
        paidAmount: 0,
        deliveryDate: new Date(new Date().setDate(new Date().getDate() + 14)), // Set delivery 14 days from now
      },
    });

    revalidatePath('/quotations');
    revalidatePath('/orders');
    return { success: true, message: 'Quote confirmed and order created.' };

  } catch (error) {
    console.error(error);
    return { error: 'Failed to confirm quote and create order.' };
  }
}

// Action to reject a quote
export async function rejectQuote(quoteId: string) {
  try {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.REJECTED },
    });
    revalidatePath('/quotations');
    return { success: true, message: 'The quote has been marked as rejected.' };
  } catch (error) {
    return { error: 'Failed to reject quote.' };
  }
}


const PartyInfoSchema = z.object({
  name: z.string().min(1, "Party name is required."),
  phone: z.string().min(1, "Phone number is required."),
});

// Action to create a new project and quote from the design store
export async function createProjectAndQuote(
  designs: Design[],
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  
  const partyInfo = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
  };

  const validatedParty = PartyInfoSchema.safeParse(partyInfo);

  if (!validatedParty.success) {
    return { error: "Invalid party information." };
  }
  
  if (!designs || designs.length === 0) {
    return { error: "No designs to create a quote for." };
  }

  try {
    const { name, phone } = validatedParty.data;
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');
    const userEmail = `${phone.replace(/\s+/g, '')}@windoor.local`;

    let customer = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' }});
    if (!adminUser) throw new Error("No admin user found to assign actions to.");

    if (!customer) {
      customer = await prisma.user.create({
        data: {
          email: userEmail,
          passwordHash: '', 
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          role: UserRole.CUSTOMER,
        },
      });
    }
    
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new Error("No manufacturing company found in the database.");
    }

    const projectNumber = `PROJ-${Date.now()}`;
    const project = await prisma.project.create({
      data: {
        projectNumber,
        name: `${name}'s Project`,
        customerId: customer.id,
        companyId: company.id,
        createdById: adminUser.id,
        status: 'QUOTED',
      },
    });

    for (const design of designs) {
      await prisma.design.create({
        data: {
          name: design.name,
          projectId: project.id,
          type: 'CUSTOM',
          width: design.parameters.width,
          height: design.parameters.height,
          quantity: 1,
          configuration: design.parameters as any,
        },
      });
    }
    
    const dbDesigns = await prisma.design.findMany({ where: { projectId: project.id }});

    const calculateArea = (width: number, height: number) => ((width / 25.4) * (height / 25.4)) / 144;
    
    let subtotal = 0;
    const quoteItemsData = dbDesigns.map((dbDesign, index) => {
      const design = designs[index];
      const area = calculateArea(design.parameters.width, design.parameters.height);
      const rate = design.rate || 360;
      const total = area * rate;
      subtotal += total;
      return {
        designId: dbDesign.id,
        quantity: 1,
        unitPrice: rate,
        totalPrice: total,
      };
    });

    const quoteNumber = `Q-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    await prisma.quote.create({
      data: {
        quoteNumber,
        projectId: project.id,
        createdById: adminUser.id,
        status: QuoteStatus.DRAFT,
        subtotal: subtotal,
        totalAmount: subtotal,
        validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
        items: {
          create: quoteItemsData,
        },
      },
    });

  } catch (error: any) {
    console.error("Failed to create project and quote:", error);
    return { error: error.message || 'An unexpected error occurred.' };
  }
  
  revalidatePath('/quotations');
  redirect('/quotations');
}
