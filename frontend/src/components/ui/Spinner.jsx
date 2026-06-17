import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className, size = 24 }) {
  return <Loader2 className={cn('animate-spin text-primary', className)} size={size} />;
}

export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
      <Spinner size={32} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
