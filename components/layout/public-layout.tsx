import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/logo';
import { ArrowRight, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center px-4 md:px-6">
                    <Link href="/" className="flex items-center gap-2 mr-auto md:mr-6">
                        <Logo />
                        <span className="font-bold font-headline">Windoor</span>
                    </Link>
                    
                    {/* Desktop Nav */}
                    <nav className="items-center gap-1 text-sm hidden md:flex">
                        <Button variant="ghost" asChild><Link href="/quotations">Quotations</Link></Button>
                        <Button variant="ghost" asChild><Link href="/orders">Orders</Link></Button>
                        <Button variant="ghost" asChild><Link href="/billing">Billing</Link></Button>
                    </nav>
                    <div className="items-center justify-end gap-2 hidden md:flex ml-auto">
                        <Button variant="ghost" asChild><Link href="/login">Login</Link></Button>
                        <Button asChild><Link href="/design">Launch Designer <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    </div>

                    {/* Mobile Nav */}
                    <div className="md:hidden ml-auto">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon"><Menu /></Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64 p-4">
                                <Link href="/" className="flex items-center gap-2 mb-8">
                                    <Logo />
                                    <span className="font-bold font-headline">Windoor</span>
                                </Link>
                                <div className="flex flex-col gap-2">
                                    <Button variant="ghost" asChild className="justify-start text-base"><Link href="/quotations">Quotations</Link></Button>
                                    <Button variant="ghost" asChild className="justify-start text-base"><Link href="/orders">Orders</Link></Button>
                                    <Button variant="ghost" asChild className="justify-start text-base"><Link href="/billing">Billing</Link></Button>
                                    <Separator className="my-2" />
                                    <Button variant="ghost" asChild className="justify-start text-base"><Link href="/login">Login</Link></Button>
                                    <Button asChild className="justify-center text-base"><Link href="/design">Launch Designer</Link></Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="border-t">
                <div className="container py-8 flex flex-col sm:flex-row items-center justify-between px-4 md:px-6 gap-4">
                    <div className="flex items-center gap-2">
                        <Logo />
                        <p className="text-sm text-muted-foreground text-center sm:text-left">&copy; {new Date().getFullYear()} Windoor. All rights reserved.</p>
                    </div>
                    <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Link href="/login" className="transition-colors hover:text-foreground">Login</Link>
                        <Link href="/design" className="transition-colors hover:text-foreground">Designer</Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
