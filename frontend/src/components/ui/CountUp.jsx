import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * CountUp — animates a number from 0 → `value` with an ease-out curve when it
 * first scrolls into view. Honors prefers-reduced-motion (renders the final
 * value instantly) and re-animates whenever `value` changes.
 *
 * Props:
 *   value:    target number
 *   duration: ms (default 900)
 *   decimals: fixed decimal places (default 0)
 *   format:   optional (n) => string|node formatter (e.g. formatPrice)
 *   prefix / suffix: strings rendered around the number when no `format` given
 */
export function CountUp({ value = 0, duration = 900, decimals = 0, format, prefix = '', suffix = '', className }) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(() => (prefersReducedMotion() ? target : 0));
  const ref = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(target);
      return;
    }
    const el = ref.current;
    let started = false;

    const run = () => {
      const start = performance.now();
      const from = 0;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        setDisplay(from + (target - from) * eased);
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    if (!el || typeof IntersectionObserver === 'undefined') {
      run();
      return () => cancelAnimationFrame(rafRef.current);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          run();
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  const rounded = decimals > 0 ? Number(display.toFixed(decimals)) : Math.round(display);
  const content = format ? format(rounded) : `${prefix}${rounded.toLocaleString()}${suffix}`;

  return (
    <span ref={ref} className={className}>
      {content}
    </span>
  );
}
