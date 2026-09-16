import { useEffect, useRef, useState } from 'react';

/** Someone who asked the OS for less motion gets the finished state, immediately. */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Reveals an element the first time it scrolls into view, and then stops watching —
 * content should never animate out from under someone scrolling back up.
 *
 * Returns a ref to attach and whether it has been seen; pair with `.reveal` in CSS.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(rootMargin = '-12% 0px') {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const element = ref.current;
    if (!element || shown) return;

    /* No IntersectionObserver (or a very old browser) must not mean invisible content. */
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.05 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, shown]);

  return { ref, shown, className: shown ? 'reveal shown' : 'reveal' };
}

/**
 * Counts up to a number once it is on screen. A metric that animates before anyone
 * looks at it has simply shown the final value in an expensive way.
 */
export function useCountUp(target: number, duration = 900) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    if (!shown || prefersReducedMotion()) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      /* Ease out, so the number settles instead of stopping dead. */
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown, target, duration]);

  return { ref, value };
}

/**
 * Tracks how far the page has scrolled, for effects that key off it (a nav that
 * condenses, a hero that drifts). Throttled to one read per frame.
 */
export function useScrollY() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        frame = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);            
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return scrollY;
}
