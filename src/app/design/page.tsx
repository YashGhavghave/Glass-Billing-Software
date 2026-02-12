'use client';

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import the main client component with SSR turned off.
// This is the key to preventing server-side evaluation of client-only libraries.
const DesignClient = dynamic(() => import('./client'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Skeleton className="h-full w-full" />
    </div>
  ),
})

export default function DesignPage() {
  return <DesignClient />
}
