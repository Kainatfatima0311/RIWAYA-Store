import { cn } from '@/lib/utils';
import { statusBadgeColor } from '@/lib/format';

export function Badge({ children, className, variant, status, ...props }) {
  const baseColors = status
    ? statusBadgeColor(status)
    : variant === 'destructive'
    ? 'bg-destructive text-destructive-foreground'
    : variant === 'outline'
    ? 'border border-border bg-transparent'
    : 'bg-secondary text-secondary-foreground';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        baseColors,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
