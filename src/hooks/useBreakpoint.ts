import { useEffect, useRef } from 'react';

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export function useBreakpoint() {
  const breakpointRef = useRef<Breakpoint>('desktop');

  useEffect(() => {
    function updateBreakpoint() {
      const width = window.innerWidth;
      if (width < 768) {
        breakpointRef.current = 'mobile';
      } else if (width < 1024) {
        breakpointRef.current = 'tablet';
      } else {
        breakpointRef.current = 'desktop';
      }
    }

    // Initial check
    updateBreakpoint();

    // Listen for resize
    window.addEventListener('resize', updateBreakpoint);
    window.addEventListener('orientationchange', updateBreakpoint);

    return () => {
      window.removeEventListener('resize', updateBreakpoint);
      window.removeEventListener('orientationchange', updateBreakpoint);
    };
  }, []);

  return breakpointRef;
}
