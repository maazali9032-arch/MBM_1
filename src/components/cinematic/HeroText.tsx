import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from 'react';
import { outfits } from '../../data/outfits';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import gsap from 'gsap';

export interface HeroTextRef {
  updateProgress: (progress: number) => void;
  /** Hard reset — call when hero remounts / scroll returns to start */
  reset: () => void;
}

function killOutfitTweens(title: HTMLElement | null, desc: HTMLElement | null) {
  if (title) gsap.killTweensOf(title);
  if (desc) gsap.killTweensOf(desc);
}

export const HeroText = forwardRef<HeroTextRef>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const descRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const currentIndexRef = useRef(-1);
  const breakpointRef = useBreakpoint();

  const [currentBreakpoint, setCurrentBreakpoint] = useState(breakpointRef.current);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const hideOutfitInstant = useCallback((index: number) => {
    const title = titleRefs.current[index];
    const desc = descRefs.current[index];
    killOutfitTweens(title, desc);
    if (title || desc) {
      gsap.set([title, desc].filter(Boolean), {
        opacity: 0,
        x: 0,
        y: 0,
        visibility: 'hidden',
      });
    }
  }, []);

  const hideOutfitAnimated = useCallback((index: number) => {
    const title = titleRefs.current[index];
    const desc = descRefs.current[index];
    if (!title || !desc) return;

    killOutfitTweens(title, desc);

    const wasEven = index % 2 === 0;
    const titleToX = wasEven ? 60 : -60;
    const descToX = wasEven ? -60 : 60;

    gsap.to(title, {
      opacity: 0,
      x: titleToX,
      duration: 0.45,
      overwrite: true,
      onComplete: () => {
        // Only hide if this outfit is still not the active one (avoids race on remount/nav).
        if (currentIndexRef.current !== index) {
          gsap.set(title, { visibility: 'hidden', x: 0, y: 0 });
        }
      },
    });
    gsap.to(desc, {
      opacity: 0,
      x: descToX,
      duration: 0.45,
      overwrite: true,
      onComplete: () => {
        if (currentIndexRef.current !== index) {
          gsap.set(desc, { visibility: 'hidden', x: 0, y: 0 });
        }
      },
    });
  }, []);

  const showOutfit = useCallback((index: number, animate: boolean) => {
    const title = titleRefs.current[index];
    const desc = descRefs.current[index];
    if (!title || !desc) return;

    killOutfitTweens(title, desc);

    const isEven = index % 2 === 0;
    const titleFromX = isEven ? -60 : 60;
    const descFromX = isEven ? 60 : -60;

    gsap.set([title, desc], { visibility: 'visible' });

    if (animate) {
      gsap.fromTo(
        title,
        { opacity: 0, x: titleFromX, y: 0 },
        { opacity: 1, x: 0, y: 0, duration: 0.7, ease: 'power2.out', overwrite: true }
      );
      gsap.fromTo(
        desc,
        { opacity: 0, x: descFromX, y: 10 },
        { opacity: 1, x: 0, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.08, overwrite: true }
      );
    } else {
      gsap.set([title, desc], { opacity: 1, x: 0, y: 0, visibility: 'visible' });
    }
  }, []);

  /** Exactly one outfit visible — kill every other layer first. */
  const setActiveOutfit = useCallback(
    (index: number, animate: boolean) => {
      if (index < 0 || index >= outfits.length) return;
      if (index === currentIndexRef.current && currentIndexRef.current >= 0) {
        // Still force exclusivity in case a stale tween left another layer visible.
        outfits.forEach((_, i) => {
          if (i !== index) hideOutfitInstant(i);
        });
        return;
      }

      const previous = currentIndexRef.current;
      currentIndexRef.current = index;
      setActiveIndex(index);

      outfits.forEach((_, i) => {
        if (i === index) return;
        if (animate && i === previous && previous >= 0) {
          hideOutfitAnimated(i);
        } else {
          hideOutfitInstant(i);
        }
      });

      showOutfit(index, animate);
    },
    [hideOutfitAnimated, hideOutfitInstant, showOutfit]
  );

  const reset = useCallback(() => {
    outfits.forEach((_, i) => hideOutfitInstant(i));
    currentIndexRef.current = -1;
    setActiveOutfit(0, false);
  }, [hideOutfitInstant, setActiveOutfit]);

  // Fresh mount / breakpoint change: exclusive reset to first tagline
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      reset();
    });
    return () => {
      cancelAnimationFrame(frame);
      // Kill all hero text tweens on unmount so they can't fire after remount.
      titleRefs.current.forEach((el) => el && gsap.killTweensOf(el));
      descRefs.current.forEach((el) => el && gsap.killTweensOf(el));
    };
  }, [currentBreakpoint, reset]);

  useImperativeHandle(
    ref,
    () => ({
      updateProgress: (progress: number) => {
        if (!containerRef.current) return;
        const numGarments = outfits.length;
        const nextIndex = Math.min(
          Math.floor(Math.max(0, Math.min(1, progress)) * numGarments),
          numGarments - 1
        );
        setActiveOutfit(nextIndex, true);
      },
      reset,
    }),
    [setActiveOutfit, reset]
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none pb-[env(safe-area-inset-bottom)]"
    >
      {outfits.map((outfit, i) => (
        <div
          key={outfit.id}
          className={`absolute flex flex-col ${outfit.positioning.text[currentBreakpoint]}`}
          aria-hidden={activeIndex !== i}
          style={{ zIndex: activeIndex === i ? 2 : 1 }}
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
