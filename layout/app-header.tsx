
import Link from 'next/link';
import Image from 'next/image';
import { Download, LogIn, LogOut, Save, Settings, Share2, User, UserPlus, FileText } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/layout/logo';
import { SidebarTrigger } from '@/components/ui/sidebar';

const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');

export function AppHeader() {
  const isLoggedIn = false; // This would be dynamic in a real app

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        <Logo />
        <h1 className="font-headline text-xl font-semibold text-primary">Windoor</h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" suppressHydrationWarning>
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Save</span>
        </Button>
        <Button variant="outline" size="sm" suppressHydrationWarning>
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Share</span>
        </Button>
        <Button asChild variant="outline" size="sm" suppressHydrationWarning>
            <Link href="/quotation">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Quote</span>
            </Link>
        </Button>
        <Button size="sm" suppressHydrationWarning>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Export</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
              suppressHydrationWarning
            >
              {isLoggedIn && userAvatar ? (
                <Image
                  src={userAvatar.imageUrl}
                  width={36}
                  height={36}
                  alt={userAvatar.description}
                  data-ai-hint={userAvatar.imageHint}
                  className="overflow-hidden rounded-full"
                />
              ) : (
                <User />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isLoggedIn ? (
              <>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>Login</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/register">
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Register</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
