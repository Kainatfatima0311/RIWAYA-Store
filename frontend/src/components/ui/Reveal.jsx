import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Map of supported entrance animations → literal Tailwind classes so the JIT
// compiler always includes them (dynamic `animate-${x}` would be purged).
const ANIM = {
  'fade-up': 'animate-fade-up',
  'fade-up-sm': 'animate-fade-up-sm',
  'fade-in': 'animate-fade-in',
  'fade-down': 'animate-fade-down',
  'scale-in': 'animate-scale-in',
  'slide-in-right': 'animate-slide-in-right',
  'slide-in-left': 'animate-slide-in-left',
};

/**
 * Reveal — animates its children into view the first time they scroll into the
 * viewport (IntersectionObserver, no dependencies). Falls back to visible when
 * IntersectionObserver is unavailable. Respects prefers-reduced-motion via the
 * global CSS guard (animations collapse to ~0ms there).
 *
 * Props:
 *   animation: one of ANIM keys (default 'fade-up')
 *   delay:     ms to stagger the entrance (for grids/lists)
 *   as:        element/tag to render (default 'div')
 *   once:      animate only once (default true)
 */
export function Reveal({ children, className, animation = 'fade-up', delay = 0, as: Tag = 'div', once = true, ...props }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) io.disconnect();
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      style={shown && delay ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(shown ? ANIM[animation] || ANIM['fade-up'] : 'opacity-0', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

/**
 * Stagger — wraps each child in a <Reveal> with an incremental delay so lists
 * and grids cascade into view. Caps the cumulative delay so long lists don't
 * leave the last items hidden for too long.
 *
 * Props:
 *   step:     ms between each child (default 60)
 *   maxDelay: cap for the cumulative delay (default 400ms)
 *   animation/once: forwarded to each Reveal
 *   as:       wrapper element (default 'div'); childAs → each item's tag
 */
export function Stagger({ children, className, step = 60, maxDelay = 400, animation = 'fade-up-sm', once = true, as: Tag = 'div', childAs = 'div', ...props }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <Tag className={className} {...props}>
      {items.map((child, i) => (
        <Reveal key={child?.key ?? i} as={childAs} animation={animation} once={once} delay={Math.min(i * step, maxDelay)}>
          {child}
        </Reveal>
      ))}
    </Tag>
  );
}
