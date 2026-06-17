import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { resolveImage } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Image with automatic branded fallback if the source fails.
 * Use this everywhere a product/category image is rendered so broken/blocked
 * external URLs never leave the user staring at a broken-image icon.
 */
export function ProductImage({ src, alt = '', className, fallbackLabel = 'RIWAYA' }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-primary/15 via-background to-accent/20 flex items-center justify-center',
          className
        )}
      >
        <div className="text-center px-4">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary opacity-50" />
          <div className="font-serif text-lg text-primary opacity-70">{fallbackLabel}</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={resolveImage(src)}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}
