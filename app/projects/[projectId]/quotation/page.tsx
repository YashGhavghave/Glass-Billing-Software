import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProjectQuotation } from '@/components/project/project-quotation';
import type { Design } from '@/lib/types';
import { Project, Quote, User, Design as DbDesign } from '@prisma/client';

type ProjectData = Project & {
    customer: User | null;
    designs: DbDesign[];
    quotes: Quote[];
};


export default async function ProjectQuotationPage({ params }: { params: { projectId: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      customer: true,
      designs: true,
      quotes: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    }
  });

  if (!project) {
    notFound();
  }

  const designsForQuote: Partial<Design>[] = project.designs.map((dbDesign) => ({
      id: dbDesign.id,
      name: dbDesign.name,
      parameters: {
          // This is a partial representation of DesignParameters
          width: dbDesign.width,
          height: dbDesign.height,
      } as Design['parameters'],
      rate: 360, // Default rate
  }));

  const partyInfo = {
      name: project.customer?.firstName ? `${project.customer.firstName} ${project.customer.lastName || ''}`.trim() : 'N/A',
      phone: project.customer?.phone || 'N/A',
      date: new Date(project.quotes[0]?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric'}),
      billNo: project.quotes[0]?.quoteNumber || 'N/A',
  };

  return (
    <ProjectQuotation
      partyInfo={partyInfo}
      designs={designsForQuote as Design[]} // Casting, as it has the required fields for the component.
    />
  );
}
