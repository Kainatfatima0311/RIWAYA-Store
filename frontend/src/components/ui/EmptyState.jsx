import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon = PackageOpen, title = 'Nothing here yet', description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center animate-fade-in', className)}>
      <div className="rounded-full bg-muted p-4 mb-4 animate-scale-in">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
