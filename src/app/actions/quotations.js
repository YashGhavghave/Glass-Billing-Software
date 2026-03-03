'use server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { QuoteStatus, OrderStatus, UserRole } from '@prisma/client';
import { createUserWithFallback } from '@/lib/user-service';

function generateId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
}

function isMongoReplicaSetError(error) {
    return error?.code === 'P2031';
}

async function ensureManufacturingCompany(prismaClient) {
    const existingCompany = await prismaClient.company.findFirst();
    if (existingCompany) {
        return existingCompany;
    }

    const defaultCompanyData = {
        name: 'Default Manufacturing Company',
        type: 'MANUFACTURER',
        email: 'factory@windoor.local',
        phone: '+0000000000',
        country: 'USA',
    };

    try {
        return await prismaClient.company.create({ data: defaultCompanyData });
    }
    catch (error) {
        if (error?.code !== 'P2031') {
            throw error;
        }

        const companyId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
        const nowIso = new Date().toISOString();
        await prismaClient.$runCommandRaw({
            insert: 'companies',
            documents: [{
                _id: companyId,
                name: defaultCompanyData.name,
                type: defaultCompanyData.type,
                email: defaultCompanyData.email,
                phone: defaultCompanyData.phone,
                country: defaultCompanyData.country,
                created_at: { $date: nowIso },
                updated_at: { $date: nowIso },
            }],
        });

        return {
            id: companyId,
            ...defaultCompanyData,
        };
    }
}

async function createProjectWithFallback(prismaClient, projectData) {
    try {
        return await prismaClient.project.create({ data: projectData });
    }
    catch (error) {
        if (!isMongoReplicaSetError(error)) {
            throw error;
        }

        const projectId = generateId();
        const nowIso = new Date().toISOString();

        await prismaClient.$runCommandRaw({
            insert: 'projects',
            documents: [{
                _id: projectId,
                project_number: projectData.projectNumber,
                name: projectData.name,
                customer_id: projectData.customerId,
                company_id: projectData.companyId,
                status: projectData.status || 'DRAFT',
                priority: 'NORMAL',
                created_at: { $date: nowIso },
                updated_at: { $date: nowIso },
            }],
        });

        return {
            id: projectId,
            ...projectData,
            priority: 'NORMAL',
            createdAt: new Date(nowIso),
            updatedAt: new Date(nowIso),
        };
    }
}

async function createDesignWithFallback(prismaClient, designData) {
    try {
        return await prismaClient.design.create({ data: designData });
    }
    catch (error) {
        if (!isMongoReplicaSetError(error)) {
            throw error;
        }

        const designId = generateId();
        const nowIso = new Date().toISOString();

        await prismaClient.$runCommandRaw({
            insert: 'designs',
            documents: [{
                _id: designId,
                name: designData.name,
                project_id: designData.projectId,
                type: designData.type,
                width: designData.width,
                height: designData.height,
                quantity: designData.quantity ?? 1,
                configuration: designData.configuration,
                created_at: { $date: nowIso },
                updated_at: { $date: nowIso },
            }],
        });

        return {
            id: designId,
            ...designData,
            quantity: designData.quantity ?? 1,
            createdAt: new Date(nowIso),
            updatedAt: new Date(nowIso),
        };
    }
}

async function createQuoteWithItemsFallback(prismaClient, quoteData, quoteItemsData) {
    try {
        await prismaClient.quote.create({
            data: {
                ...quoteData,
                items: {
                    create: quoteItemsData,
                },
            },
        });
        return;
    }
    catch (error) {
        if (!isMongoReplicaSetError(error)) {
            throw error;
        }

        const quoteId = generateId();
        const nowIso = new Date().toISOString();

        await prismaClient.$runCommandRaw({
            insert: 'quotes',
            documents: [{
                _id: quoteId,
                quote_number: quoteData.quoteNumber,
                project_id: quoteData.projectId,
                created_by_id: quoteData.createdById,
                status: quoteData.status || 'DRAFT',
                subtotal: quoteData.subtotal,
                discount_percent: 0,
                discount_amount: 0,
                tax_percent: 0,
                tax_amount: 0,
                total_amount: quoteData.totalAmount,
                valid_until: { $date: quoteData.validUntil.toISOString() },
                created_at: { $date: nowIso },
                updated_at: { $date: nowIso },
            }],
        });

        if (quoteItemsData.length > 0) {
            await prismaClient.$runCommandRaw({
                insert: 'quote_items',
                documents: quoteItemsData.map((item) => ({
                    _id: generateId(),
                    quote_id: quoteId,
                    design_id: item.designId,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    total_price: item.totalPrice,
                    created_at: { $date: nowIso },
                })),
            });
        }
    }
}
// Action to confirm a quote and create an order
export async function confirmQuote(quoteId) {
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
                status: OrderStatus.CONFIRMED,
                totalAmount: quote.totalAmount,
                paidAmount: 0,
                deliveryDate: new Date(new Date().setDate(new Date().getDate() + 14)), // Set delivery 14 days from now
            },
        });
        revalidatePath('/quotations');
        revalidatePath('/orders');
        return { success: true, message: 'Quote confirmed and order created.' };
    }
    catch (error) {
        console.error(error);
        return { error: 'Failed to confirm quote and create order.' };
    }
}
// Action to reject a quote
export async function rejectQuote(quoteId) {
    try {
        await prisma.quote.update({
            where: { id: quoteId },
            data: { status: QuoteStatus.REJECTED },
        });
        revalidatePath('/quotations');
        return { success: true, message: 'The quote has been marked as rejected.' };
    }
    catch (error) {
        return { error: 'Failed to reject quote.' };
    }
}
const PartyInfoSchema = z.object({
    name: z.string().min(1, "Party name is required."),
    phone: z.string().min(1, "Phone number is required."),
});
// Action to create a new project and quote from the design store
export async function createProjectAndQuote(designs, prevState, formData) {
    const partyInfo = {
        name: formData.get('name'),
        phone: formData.get('phone'),
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
        if (!customer) {
            customer = await createUserWithFallback(prisma, {
                email: userEmail,
                passwordHash: '',
                firstName: firstName,
                lastName: lastName,
                phone: phone,
                role: UserRole.CUSTOMER,
            });
        }
        const company = await ensureManufacturingCompany(prisma);
        const projectNumber = `PROJ-${Date.now()}`;
        const project = await createProjectWithFallback(prisma, {
            projectNumber,
            name: `${name}'s Project`,
            customerId: customer.id,
            companyId: company.id,
            status: 'QUOTED',
        });
        const dbDesigns = [];
        for (const design of designs) {
            const createdDesign = await createDesignWithFallback(prisma, {
                name: design.name,
                projectId: project.id,
                type: 'CUSTOM',
                width: design.parameters.width,
                height: design.parameters.height,
                quantity: 1,
                configuration: design.parameters,
            });
            dbDesigns.push(createdDesign);
        }
        const calculateArea = (width, height) => ((width / 25.4) * (height / 25.4)) / 144;
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
        const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
        const quoteCreatorId = adminUser?.id || customer.id;
        await createQuoteWithItemsFallback(
            prisma,
            {
                quoteNumber,
                projectId: project.id,
                createdById: quoteCreatorId,
                status: QuoteStatus.DRAFT,
                subtotal: subtotal,
                totalAmount: subtotal,
                validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
            },
            quoteItemsData
        );
    }
    catch (error) {
        console.error("Failed to create project and quote:", error);
        return { error: error.message || 'An unexpected error occurred.' };
    }
    revalidatePath('/quotations');
    redirect('/quotations');
}
