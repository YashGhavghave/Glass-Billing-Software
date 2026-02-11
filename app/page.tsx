import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Package, Receipt, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-image');
const featureImage = PlaceHolderImages.find((img) => img.id === 'feature-image');

export default function LandingPage() {
  return (
    <PublicLayout>
        <section className="relative py-20 sm:py-32">
             <div className="absolute inset-0 -z-10">
                {heroImage && (
                    <Image
                        src={heroImage.imageUrl}
                        alt={heroImage.description}
                        fill
                        className="object-cover"
                        data-ai-hint={heroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent"></div>
            </div>
          <div className="container relative text-left px-4 md:px-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight font-headline sm:text-6xl text-foreground">
                Design Your Perfect Windows & Doors
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Our powerful, intuitive design tool and ERP system streamline everything from quotation to production.
                Built for manufacturers, dealers, and their customers.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Button asChild size="lg">
                    <Link href="/design">Launch Designer <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild variant="link" size="lg">
                    <Link href="#features">Learn more <span aria-hidden="true">→</span></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 sm:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">A Complete ERP Solution</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">From the initial design to the final invoice, Windoor provides the tools you need to manage your entire workflow.</p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline"><FileText /> Quotations</CardTitle>
                  <CardDescription>Create, view, and manage all your price quotes with our powerful design tool.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/quotations">Manage Quotations</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline"><Package /> Orders</CardTitle>
                  <CardDescription>Track customer orders from confirmation to delivery with a clear production workflow.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/orders">Track Orders</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline"><Receipt /> Billing</CardTitle>
                  <CardDescription>Generate and manage professional invoices and track payments automatically.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Button asChild className="w-full">
                    <Link href="/billing">Handle Billing</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-muted py-20 sm:py-32">
            <div className="container px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">Key Features for Your Business</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Our platform is packed with features designed to improve accuracy, save time, and boost your bottom line.
                        </p>
                        <ul className="mt-8 space-y-4 text-base text-muted-foreground">
                            <li className="flex gap-x-3">
                                <CheckCircle className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
                                <span><span className="font-semibold text-foreground">Visual Design Tool:</span> Eliminate errors with a canvas-based window and door designer.</span>
                            </li>
                            <li className="flex gap-x-3">
                                <CheckCircle className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
                                <span><span className="font-semibold text-foreground">Automated Quoting:</span> Generate accurate quotes in minutes, not hours.</span>
                            </li>
                             <li className="flex gap-x-3">
                                <CheckCircle className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
                                <span><span className="font-semibold text-foreground">Production Workflow:</span> From cutting lists to CNC file generation, streamline your production line.</span>
                            </li>
                             <li className="flex gap-x-3">
                                <CheckCircle className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
                                <span><span className="font-semibold text-foreground">Customer Portal:</span> Empower customers to view and approve quotes and track order status.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="relative h-96">
                       {featureImage && <Image 
                           src={featureImage.imageUrl}
                           alt={featureImage.description}
                           fill
                           className="rounded-xl object-cover shadow-2xl"
                           data-ai-hint={featureImage.imageHint}
                       />}
                    </div>
                </div>
            </div>
        </section>

    </PublicLayout>
  );
}
