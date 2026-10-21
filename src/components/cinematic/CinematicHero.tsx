import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useLocation, Link } from 'wouter';
import { useLenis, destroyLenis } from '../../hooks/useLenis';
import { VideoSequence, type VideoSequenceRef } from './VideoSequence';
import { HeroText, type HeroTextRef } from './HeroText';
import { ScrollIndicator } from './ScrollIndicator';
import { outfits } from '../../data/outfits';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { siteContent } from '../../data/site';

gsap.registerPlugin(ScrollTrigger);

function teardownHeroScroll() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill(true));
  ScrollTrigger.clearScrollMemory();
  destroyLenis();
  document.body.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('overflow');
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
}

export function CinematicHero() {
  useLenis();

  const [, setLocation] = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const videoSeqRef = useRef<VideoSequenceRef>(null);
  const textRef = useRef<HeroTextRef>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const breakpointRef = useBreakpoint();

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const whatsappUrl = `https://wa.me/${siteContent.business.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Hi, I'm interested in your clothing collections at Maqdoom's Big Mall.")}`;

  const handleVisit = () => {
    setMenuOpen(false);
    if (window.location.pathname === '/') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setLocation('/#contact');
    }
  };

  const handleContact = () => {
    setMenuOpen(false);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCollections = () => {
    setMenuOpen(false);
    // Pin + Lenis must be cleared before SPA navigate or mobile stays stuck on the hero.
    teardownHeroScroll();
    setLocation('/collections');
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!heroRef.current) return;

    const getScrollDistance = () => {
      const bp = breakpointRef.current;
      if (bp === 'mobile') return window.innerHeight * 3;
      if (bp === 'tablet') return window.innerHeight * 3.5;
      return window.innerHeight * 4;
    };

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: () => `+=${getScrollDistance()}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          videoSeqRef.current?.updateProgress(self.progress);
          textRef.current?.updateProgress(self.progress);
        },
      });

      if (indicatorRef.current) {
        gsap.to(indicatorRef.current, {
          opacity: 0,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: '+=200',
            scrub: true,
          },
        });
      }
    }, heroRef);

    // After pin setup / remount (e.g. return from Collections), force a clean text+video start.
    requestAnimationFrame(() => {
      textRef.current?.reset();
      videoSeqRef.current?.updateProgress(0);
    });

    return () => {
      ctx.revert();
      destroyLenis();
    };
  }, [prefersReducedMotion, breakpointRef]);

  const navLinks = (
    <div className="hidden md:flex gap-12 font-sans text-xs tracking-[0.15em] font-light text-[var(--color-mahek-ivory)]">
      <Link
        href="/collections"
        onClick={teardownHeroScroll}
        className="hover:text-[var(--color-mahek-accent)] transition-colors drop-shadow-md"
      >
        COLLECTION
      </Link>
      <button
        type="button"
        onClick={handleContact}
        className="hover:text-[var(--color-mahek-accent)] transition-colors drop-shadow-md cursor-pointer"
      >
        CONTACT
      </button>
      <button
        type="button"
        onClick={handleVisit}
        className="hover:text-[var(--color-mahek-accent)] transition-colors drop-shadow-md cursor-pointer"
      >
        VISIT
      </button>
    </div>
  );

  const mobileMenu = (
    <div className="md:hidden relative z-50">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="font-sans text-xs tracking-[0.15em] font-light text-[var(--color-mahek-ivory)] cursor-pointer drop-shadow-md px-2 py-1"
        aria-expanded={menuOpen}
        aria-label="Toggle menu"
      >
        {menuOpen ? 'CLOSE' : 'MENU'}
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-3 z-[70] min-w-[200px] bg-[#1A1A1A]/95 backdrop-blur-md border border-white/10 rounded-sm shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={handleCollections}
              className="w-full text-left px-5 py-4 text-xs tracking-[0.15em] text-[var(--color-mahek-ivory)] hover:bg-white/10 transition-colors cursor-pointer border-b border-white/5"
            >
              COLLECTIONS
            </button>
            <button
              type="button"
              onClick={handleContact}
              className="w-full text-left px-5 py-4 text-xs tracking-[0.15em] text-[var(--color-mahek-ivory)] hover:bg-white/10 transition-colors cursor-pointer border-b border-white/5"
            >
              CONTACT
            </button>
            <button
              type="button"
              onClick={handleVisit}
              className="w-full text-left px-5 py-4 text-xs tracking-[0.15em] text-[var(--color-mahek-ivory)] hover:bg-white/10 transition-colors cursor-pointer"
            >
              VISIT
            </button>
          </div>
        </>
      )}
    </div>
  );

  const brandLink = (
    <Link href="/" className="inline-flex items-center shrink-0" aria-label="Maqdoom's Big Mall home">
      <img
        src="/Logo.png"
        alt="Maqdoom's Big Mall"
        className="h-9 md:h-12 w-auto object-contain drop-shadow-md"
        decoding="async"
      />
    </Link>
  );

  if (prefersReducedMotion) {
    return (
      <div className="w-full bg-[var(--color-mahek-charcoal)] text-[var(--color-mahek-ivory)] flex flex-col">
        <nav className="relative pt-[env(safe-area-inset-top)] z-50 px-6 py-6 md:px-12 md:py-10 flex justify-between items-center">
          {brandLink}
          {navLinks}
          {mobileMenu}
        </nav>
        {outfits.map((outfit) => (
          <div key={outfit.id} className="relative w-full h-screen">
            <img src={outfit.posterSrc} alt={outfit.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center">
              <h1 className="font-serif text-4xl md:text-6xl font-extralight tracking-widest uppercase drop-shadow-lg">
                {outfit.title}
              </h1>
              <p className="font-sans text-white/80 mt-4 text-xl font-light drop-shadow-md">
                {outfit.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={heroRef} className="relative w-full h-screen bg-[var(--color-mahek-charcoal)] overflow-hidden">
      <VideoSequence ref={videoSeqRef} />
      <nav className="absolute top-0 inset-x-0 pt-[env(safe-area-inset-top)] z-50 px-6 py-6 md:px-12 md:py-10 flex justify-between items-center pointer-events-auto">
        {brandLink}
        {navLinks}
        {mobileMenu}
      </nav>
      <HeroText ref={textRef} />
      <div
        ref={indicatorRef}
        className="absolute inset-x-0 bottom-8 pb-[env(safe-area-inset-bottom)] pointer-events-none"
      >
        <ScrollIndicator />
      </div>
    </div>
  );
}
