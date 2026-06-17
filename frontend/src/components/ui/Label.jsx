import { cn } from '@/lib/utils';

export function Label({ className, children, htmlFor, required, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('text-sm font-medium leading-none mb-1.5 inline-block', className)}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return <p className="text-xs text-destructive mt-1">{children}</p>;
}

export function FormHint({ children }) {
  if (!children) return null;
  return <p className="text-xs text-muted-foreground mt-1">{children}</p>;
}
