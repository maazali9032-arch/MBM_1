import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from 'react';
import { outfits } from '../../data/outfits';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import gsap from 'gsap';

export interface HeroTextRef {
  updateProgress: (progress: number) => void;
}

export const HeroText = forwardRef<HeroTextRef>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const descRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const currentIndexRef = useRef(-1);
  const breakpointRef = useBreakpoint();

  const [currentBreakpoint, setCurrentBreakpoint] = useState(breakpointRef.current);

  useEffect(() => {
    const checkBreakpoint = () => {
      if (breakpointRef.current !== currentBreakpoint) {
        setCurrentBreakpoint(breakpointRef.current);
      }
    };
    window.addEventListener('resize', checkBreakpoint);
    window.addEventListener('orientationchange', checkBreakpoint);
    return () => {
      window.removeEventListener('resize', checkBreakpoint);
      window.removeEventListener('orientationchange', checkBreakpoint);
    };
  }, [currentBreakpoint, breakpointRef]);

  const hideOutfit = useCallback((index: number, animate: boolean) => {
    const title = titleRefs.current[index];
    const desc = descRefs.current[index];
    if (!title || !desc) return;

    const wasEven = index % 2 === 0;
    const titleToX = wasEven ? 60 : -60;
    const descToX = wasEven ? -60 : 60;

    if (animate) {
      gsap.to(title, {
        opacity: 0,
        x: titleToX,
        duration: 0.5,
        overwrite: 'auto',
        onComplete: () => gsap.set(title, { visibility: 'hidden' }),
      });
      gsap.to(desc, {
        opacity: 0,
        x: descToX,
        duration: 0.5,
        overwrite: 'auto',
        onComplete: () => gsap.set(desc, { visibility: 'hidden' }),
      });
    } else {
      gsap.set([title, desc], { opacity: 0, x: 0, y: 0, visibility: 'hidden' });
    }
  }, []);

  const showOutfit = useCallback((index: number, animate: boolean) => {
    const title = titleRefs.current[index];
    const desc = descRefs.current[index];
    if (!title || !desc) return;

    const isEven = index % 2 === 0;
    const titleFromX = isEven ? -60 : 60;
    const descFromX = isEven ? 60 : -60;

    gsap.set([title, desc], { visibility: 'visible' });

    if (animate) {
      gsap.fromTo(
        title,
        { opacity: 0, x: titleFromX, y: 0 },
        { opacity: 1, x: 0, y: 0, duration: 0.8, ease: 'power2.out', overwrite: 'auto' }
      );
      gsap.fromTo(
        desc,
        { opacity: 0, x: descFromX, y: 10 },
        { opacity: 1, x: 0, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1, overwrite: 'auto' }
      );
    } else {
      gsap.set([title, desc], { opacity: 1, x: 0, y: 0, visibility: 'visible' });
    }
  }, []);

  const setActiveOutfit = useCallback(
    (index: number, animate: boolean) => {
      if (index < 0 || index >= outfits.length) return;

      if (currentIndexRef.current >= 0 && currentIndexRef.current !== index) {
        hideOutfit(currentIndexRef.current, animate);
      }

      showOutfit(index, animate);
      currentIndexRef.current = index;
    },
    [hideOutfit, showOutfit]
  );

  // Show Sherwani (first outfit) immediately on load and after breakpoint changes
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      outfits.forEach((_, i) => {
        if (i !== 0) hideOutfit(i, false);
      });
      setActiveOutfit(0, false);
    });
    return () => cancelAnimationFrame(frame);
  }, [currentBreakpoint, hideOutfit, setActiveOutfit]);

  useImperativeHandle(ref, () => ({
    updateProgress: (progress: number) => {
      if (!containerRef.current) return;
      const numGarments = outfits.length;
      const activeIndex = Math.min(Math.floor(progress * numGarments), numGarments - 1);

      if (activeIndex !== currentIndexRef.current) {
        setActiveOutfit(activeIndex, true);
      }
    },
  }));

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      {outfits.map((outfit, i) => (
        <div
          key={outfit.id}
          className={`absolute flex flex-col ${outfit.positioning.text[currentBreakpoint]}`}
          aria-hidden={currentIndexRef.current !== i}
        >
          <h1
            ref={(el) => {
              titleRefs.current[i] = el;
            }}
            className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none tracking-[0.15em] uppercase opacity-0 invisible text-[var(--color-mahek-ivory)] drop-shadow-xl"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            {outfit.title}
          </h1>
          <p
            ref={(el) => {
              descRefs.current[i] = el;
            }}
            className="font-sans text-[clamp(1rem,1.5vw,1.25rem)] mt-2 md:mt-4 font-light tracking-widest opacity-0 invisible text-[var(--color-mahek-ivory)]/90 drop-shadow-md"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}
          >
            {outfit.description}
          </p>
        </div>
      ))}
    </div>
  );
});
