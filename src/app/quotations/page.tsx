import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/layout/public-layout';
import { FileText, PlusCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import prisma from '@/lib/prisma';
import { Project, Quote, User } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { QuoteActions } from '@/components/project/quote-actions';

type QuoteWithProject = Quote & {
  project: Project & {
    customer: User | null;
  }
};

export default async function QuotationsPage({ searchParams }: { searchParams?: { q?: string; }; }) {
  const qQuery = searchParams?.q || '';

  const recentQuotes: QuoteWithProject[] = await prisma.quote.findMany({
    where: {
      OR: [
        { quoteNumber: { contains: qQuery, mode: 'insensitive' } },
        { project: { name: { contains: qQuery, mode: 'insensitive' } } },
        { project: { customer: { firstName: { contains: qQuery, mode: 'insensitive' } } } },
        { project: { customer: { lastName: { contains: qQuery, mode: 'insensitive' } } } },
      ],
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      project: {
        include: {
          customer: true,
        },
      },
    },
  }).catch(() => []);

  return (
    <PublicLayout>
      <section id="quotations" className="py-12 sm:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">Quotations</h2>
              <p className="mt-2 text-lg text-muted-foreground">Create, send, and manage all your price quotations.</p>
            </div>
            <Button asChild size="lg">
              <Link href="/design"><PlusCircle className="mr-2" /> New Quotation</Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <form action="/quotations" className="w-full max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input name="q" placeholder="Search by quote #, project, or customer..." className="pl-8" defaultValue={qQuery} />
                  </div>
                </form>
              </div>
            </CardHeader>
            <CardContent>
              {recentQuotes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recentQuotes.map((quote) => (
                    <Card key={quote.id} className="flex flex-col hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="font-headline">{quote.project.name}</CardTitle>
                          <Badge variant={quote.status === 'APPROVED' || quote.status === 'CONVERTED' ? 'default' : 'secondary'}>{quote.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground pt-1">{quote.quoteNumber}</p>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">
                          {quote.project.customer?.firstName} {quote.project.customer?.lastName}
                        </p>
                        <p className="text-2xl font-semibold mt-2">
                          {Number(quote.totalAmount).toFixed(2)}
                        </p>
                        <QuoteActions quote={quote} />
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full" variant="secondary">
                          <Link href={`/projects/${quote.projectId}/quotation`}>
                            <FileText className="mr-2 h-4 w-4" /> View Quotation
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Quotations Found</h3>
                  <p className="mt-1 text-sm">
                    {qQuery ? `No results for "${qQuery}".` : "You haven't created any quotations yet."}
                  </p>
                  <Button className="mt-6" asChild>
                    <Link href="/design"><PlusCircle className="mr-2" /> Create Quotation</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
