import { useEffect, useState } from 'react';

/**
 * useReducedMotion — reactive boolean for the user's OS "reduce motion" setting.
 * Use it to disable JS-driven animations that CSS can't reach (e.g. Recharts
 * `isAnimationActive={!reduced}`). CSS animations are already neutralized by the
 * global `prefers-reduced-motion` guard in index.css.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return reduced;
}
