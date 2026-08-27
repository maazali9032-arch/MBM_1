import { useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import ScrollTrigger from 'gsap/ScrollTrigger';

/**
 * Cleans up GSAP scroll/pin state and resets scroll position on every route change.
 * Without this, pinned homepage sections can ghost over the next page after SPA navigation.
 */
export function RouteEffects() {
  const [location] = useLocation();
  const search = useSearch();

  useEffect(() => {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    ScrollTrigger.clearScrollMemory();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location, search]);

  return null;
}
