import { Loader } from 'lucide-react';

export default function Loading() {
    return (<div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5 rounded-xl border bg-card px-8 py-10 shadow-sm">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/10"/>
          <Loader className="relative h-10 w-10 animate-spin text-primary"/>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="font-medium text-foreground">Loading page</p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }}/>
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '120ms' }}/>
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '240ms' }}/>
          </div>
          <p className="text-sm text-muted-foreground">Please wait a moment...</p>
        </div>
      </div>
    </div>);
}
