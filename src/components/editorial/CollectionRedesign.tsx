import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { outfits } from '../../data/outfits';

gsap.registerPlugin(ScrollTrigger);


// Helper to determine if we are on desktop for the horizontal sequence
const isDesktop = (breakpoint: string) => breakpoint === 'desktop';

export const CollectionRedesign = () => {
  const breakpointRef = useBreakpoint();
  const breakpoint = breakpointRef.current;

  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
    return () => clearTimeout(timer);
  }, [breakpoint]);

  return (
    <section id="collection" className="space-y-32 bg-[#FAF9F6]">
      {/* Garment 01 – Large Editorial Hero */}
      <Garment01 index={0} />

      {/* Garment 02 – Asymmetric */}
      <Garment02 index={1} />

      {/* Garment 03 – Horizontal Sequence (desktop only) */}
      {isDesktop(breakpoint) ? (
        <Garment03 index={2} />
      ) : (
        <Garment03Fallback index={2} />
      )}

      {/* Garment 04 – Full‑Bleed */}
      <Garment04 index={3} />
    </section>
  );
};

// ------------------------------------------------------------
// Garment 01 – Large Editorial Hero
// ------------------------------------------------------------
const Garment01 = ({ index }: { index: number }) => {
  const outfit = outfits[index];
  const sectionRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    if (!sectionRef.current || !imgRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgRef.current,
        { scale: 1.03 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            refreshPriority: -10,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center h-[80vh] overflow-hidden"
    >
      <picture className="absolute inset-0 w-full h-full">
        <source srcSet={outfit.posterSrc.replace(/\\.webp$/, '.avif')} type="image/avif" />
        <img
          ref={imgRef}
          src={outfit.posterSrc}
          alt={outfit.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </picture>
      <div className="relative z-10 text-center text-[#1A1A1A]">
        <p className="text-sm tracking-widest text-[#8C8C8C] mb-2">0{index + 1}</p>
        <h2 className="font-serif text-[clamp(2rem,6vw,4rem)] uppercase mb-2">
          {outfit.title}
        </h2>
      </div>
    </section>
  );
};

// ------------------------------------------------------------
// Garment 02 – Asymmetric Editorial
// ------------------------------------------------------------
const Garment02 = ({ index }: { index: number }) => {
  const outfit = outfits[index];
  const sectionRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    if (!sectionRef.current || !imgRef.current || !textRef.current) return;

    const ctx = gsap.context(() => {
      // Image slower, text slightly faster
      gsap.fromTo(
        imgRef.current,
        { y: 30 },
        {
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            refreshPriority: -10,
          },
        }
      );
      gsap.fromTo(
        textRef.current,
        { y: 10 },
        {
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            refreshPriority: -10,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="flex flex-col md:flex-row items-center md:justify-between md:gap-12 h-[80vh] overflow-hidden"
    >
      {/* Image positioned left on even index, right on odd – here index 1 => right */}
      <div className="md:w-1/2 order-2 md:order-1">
        <picture>
          <source srcSet={outfit.posterSrc.replace(/\\.webp$/, '.avif')} type="image/avif" />
          <img
            ref={imgRef}
            src={outfit.posterSrc}
            alt={outfit.title}
            className="w-full h-auto object-cover"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>
      <div
        ref={textRef}
        className="md:w-1/2 md:pr-8 text-[#1A1A1A]"
      >
        <p className="text-sm tracking-widest text-[#8C8C8C] mb-1">0{index + 1}</p>
        <h2 className="font-serif text-[clamp(1.5rem,4vw,3rem)] uppercase mb-2">
          {outfit.title}
        </h2>
        <p className="text-base max-w-md whitespace-pre-line">
          {outfit.description}
        </p>
      </div>
    </section>
  );
};

// ------------------------------------------------------------
// Garment 03 – Horizontal Cinematic Sequence (desktop)
// ------------------------------------------------------------
const Garment03 = ({ index }: { index: number }) => {
  const outfit = outfits[index];
  const sectionRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    if (!sectionRef.current || !stripRef.current) return;

    const ctx = gsap.context(() => {
      const totalTravel = stripRef.current!.scrollWidth - window.innerWidth;
      gsap.to(stripRef.current, {
        x: -totalTravel,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          pin: true,
          anticipatePin: 1,
          refreshPriority: -10,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[80vh] overflow-hidden bg-[#FAF9F6]"
    >
      <div
        ref={stripRef}
        className="flex h-full"
      >
        {/* Image Block */}
        <div className="flex-shrink-0 w-screen flex items-center justify-center">
          <picture>
            <source srcSet={outfit.posterSrc.replace(/\\.webp$/, '.avif')} type="image/avif" />
            <img
              src={outfit.posterSrc}
              alt={outfit.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
        {/* Text Block */}
        <div className="flex-shrink-0 w-screen flex items-center justify-center px-8">
          <div className="max-w-md text-center text-[#1A1A1A]">
            <p className="text-sm tracking-widest text-[#8C8C8C] mb-1">0{index + 1}</p>
            <h2 className="font-serif text-[clamp(2rem,5vw,4rem)] uppercase mb-2">
              {outfit.title}
            </h2>
            <p className="text-base whitespace-pre-line">
              {outfit.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Fallback for tablet/mobile – simple vertical layout similar to Garment01
const Garment03Fallback = ({ index }: { index: number }) => {
  const outfit = outfits[index];
  const sectionRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    if (!sectionRef.current || !imgRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgRef.current,
        { scale: 1.03 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            refreshPriority: -10,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center h-[80vh] overflow-hidden"
    >
      <picture className="absolute inset-0 w-full h-full">
        <source srcSet={outfit.posterSrc.replace(/\\.webp$/, '.avif')} type="image/avif" />
        <img
          ref={imgRef}
          src={outfit.posterSrc}
          alt={outfit.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </picture>
      <div className="relative z-10 text-center text-[#1A1A1A]">
        <p className="text-sm tracking-widest text-[#8C8C8C] mb-2">0{index + 1}</p>
        <h2 className="font-serif text-[clamp(2rem,6vw,4rem)] uppercase mb-2">
          {outfit.title}
        </h2>
        <p className="text-base max-w-md mx-auto whitespace-pre-line">
          {outfit.description}
        </p>
      </div>
    </section>
  );
};

// ------------------------------------------------------------
// Garment 04 – Full‑Bleed Closing Statement
// ------------------------------------------------------------
const Garment04 = ({ index }: { index: number }) => {
  const outfit = outfits[index];
  const sectionRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    if (!sectionRef.current || !imgRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgRef.current,
        { scale: 1.04, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
            once: true,
            refreshPriority: -10,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[80vh] overflow-hidden"
    >
      <picture className="absolute inset-0 w-full h-full">
        <source srcSet={outfit.posterSrc.replace(/\\.webp$/, '.avif')} type="image/avif" />
        <img
          ref={imgRef}
          src={outfit.posterSrc}
          alt={outfit.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </picture>
      <div className="relative z-10 flex items-end justify-end h-full p-8 text-[#FAF9F6]">
        <div className="text-right">
          <p className="text-sm tracking-widest text-[#C5A880] mb-1">0{index + 1}</p>
          <h2 className="font-serif text-[clamp(2rem,5vw,4rem)] uppercase">
            {outfit.title}
          </h2>
        </div>
      </div>
    </section>
  );
};
