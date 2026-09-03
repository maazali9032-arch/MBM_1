import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { collectionFilterPath, allCollectionsPath } from '../../lib/collectionRoutes';

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { title: 'Sherwani', slug: 'sherwanis', categoryId: 'sherwani', image: '/images/SHW1.webp', avif: '/images/SHW1.avif' },
  { title: 'Suit', slug: 'suits', categoryId: 'suit', image: '/images/SUT1.webp', avif: '/images/SUT1.avif' },
  { title: 'Bandgala', slug: 'bandgalas', categoryId: 'bandgala', image: '/images/Bandhgala.jpeg', avif: '' },
  { title: 'Jodhpuri', slug: 'jodhpuris', categoryId: 'jodhpuri', image: '/images/JSUT.webp', avif: '/images/JSUT.avif' },
  { title: 'Kurta Pajama', slug: 'kurta-pajamas', categoryId: 'kurta', image: '/images/KP1.webp', avif: '/images/KP1.avif' },
  { title: 'Nehru Jacket', slug: 'nehru-jackets', categoryId: 'nehru', image: '/images/Nehru jacket.jpeg', avif: '' },
  { title: 'Formal Outfit', slug: 'formals', categoryId: 'formal', image: '/images/formal outfit.jpeg', avif: '' },
  { title: 'Pathani', slug: 'pathanis', categoryId: 'pathani', image: '/images/pathani.jpeg', avif: '' },
];

export const CollectionShowcase = () => {
  const [, setLocation] = useLocation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    isDragging: false,
  });
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const horizontalTweenRef = useRef<gsap.core.Tween | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    if (!sectionRef.current || !cardRef.current || !stripRef.current || !buttonRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=250%',
          pin: true,
          scrub: true,
          anticipatePin: 1,
          refreshPriority: -10,
        }
      });
      timelineRef.current = tl;

      // 1. Solid plain white card slides in from right to center
      tl.fromTo(cardRef.current,
        { x: '100vw', backgroundColor: '#FFFFFF', borderColor: 'transparent', borderWidth: '1px' },
        { x: '0vw', ease: 'power2.out', duration: 1 }
      );

      // 2. Horizontal scroll of the vertical images inside the card
      const getTravelDistance = () => {
        if (!stripRef.current) return 0;
        return Math.max(0, stripRef.current.scrollWidth - stripRef.current.clientWidth + 48);
      };

      tl.to(stripRef.current, {
        scrollLeft: () => getTravelDistance(),
        ease: 'none',
        duration: 2,
      });

      const horizontalTween = tl.getChildren(false, true, false).at(-1) as gsap.core.Tween;

      horizontalTweenRef.current = horizontalTween;
      scrollTriggerRef.current = tl.scrollTrigger ?? null;

      // 3. Card becomes transparent with a clean border
      tl.to(cardRef.current, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        borderColor: '#C5A880',
        duration: 0.5
      });

      // 4. Fade in CTA button
      tl.fromTo(buttonRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4 },
        '-=0.3'
      );
    }, sectionRef);

    return () => {
      scrollTriggerRef.current = null;
      horizontalTweenRef.current = null;
      timelineRef.current = null;
      ctx.revert();
    };
  }, []);

  // A horizontal drag is translated into progress through the pinned section.
  // This keeps touch/trackpad interaction and normal vertical scrolling on one timeline.
  const syncDragToScroll = (clientX: number) => {
    const strip = stripRef.current;
    const trigger = scrollTriggerRef.current;
    const horizontalTween = horizontalTweenRef.current;
    const drag = dragState.current;
    if (!strip || !trigger || !horizontalTween || drag.pointerId === -1) return;

    const travel = Math.max(0, strip.scrollWidth - strip.clientWidth + 48);
    if (!travel || trigger.end <= trigger.start) return;

    const nextScrollLeft = Math.min(travel, Math.max(0, drag.startScrollLeft + drag.startX - clientX));
    const timeline = timelineRef.current;
    if (!timeline) return;

    const horizontalProgress = nextScrollLeft / travel;
    const timelineProgress = (horizontalTween.startTime() + horizontalProgress * horizontalTween.duration()) / timeline.duration();
    const pageScroll = trigger.start + timelineProgress * (trigger.end - trigger.start);

    window.scrollTo({ top: pageScroll, left: 0, behavior: 'auto' });
    drag.isDragging ||= Math.abs(clientX - drag.startX) > 5;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: stripRef.current?.scrollLeft ?? 0,
      isDragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== dragState.current.pointerId) return;
    if (!dragState.current.isDragging && Math.abs(event.clientX - dragState.current.startX) <= 5) return;
    dragState.current.isDragging = true;
    syncDragToScroll(event.clientX);
  };

  const finishPointerDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== dragState.current.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragState.current.pointerId = -1;
    if (event.type === 'pointercancel') dragState.current.isDragging = false;
  };

  const goToCategory = (categoryId: string) => {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    ScrollTrigger.clearScrollMemory();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    setLocation(collectionFilterPath(categoryId));
  };

  return (
    <section
      ref={sectionRef}
      id="collection"
      className="relative min-h-screen bg-[#FAF9F6] text-[#1A1A1A] py-20 flex flex-col justify-center overflow-hidden"
    >
      {/* Dynamic Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="w-full max-w-screen-2xl mx-auto px-6 md:px-12 flex flex-col items-center flex-grow justify-center relative z-10">
        <h2 className="font-serif text-[clamp(2.5rem,6vw,4rem)] text-center tracking-[0.1em] uppercase mb-10 text-[#1A1A1A]">
          Collections
        </h2>

        {/* The Card Container */}
        <div
          ref={cardRef}
          className="w-full lg:w-[90vw] xl:w-[85vw] h-[62vh] min-h-[480px] rounded-sm shadow-[0_15px_50px_-15px_rgba(0,0,0,0.06)] border border-transparent p-6 md:p-10 flex flex-col justify-between overflow-hidden relative"
        >
          {/* Scrollable Strip inside the Card */}
          <div
            ref={stripRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointerDrag}
            onPointerCancel={finishPointerDrag}
            onClickCapture={(event) => {
              if (dragState.current.isDragging) {
                event.preventDefault();
                event.stopPropagation();
                dragState.current.isDragging = false;
              }
            }}
            className="flex items-center gap-6 md:gap-10 h-[80%] flex-nowrap overflow-x-hidden relative z-20 touch-pan-y select-none"
          >
            {categories.map((cat, i) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => goToCategory(cat.categoryId)}
                className="flex-shrink-0 w-[240px] md:w-[280px] h-full flex flex-col justify-between group relative cursor-pointer text-left bg-transparent border-0 p-0"
              >
                <div className="w-full h-[85%] overflow-hidden rounded-sm relative">
                  <picture className="block w-full h-full">
                    {cat.avif && <source srcSet={cat.avif} type="image/avif" />}
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                  {/* Luxury hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
                
                <div className="flex items-center justify-between mt-3 px-1">
                  <span className="font-serif text-xs tracking-widest text-[#8C8C8C]">0{i + 1}</span>
                  <h3 className="font-serif text-sm md:text-base tracking-[0.15em] uppercase text-[#1A1A1A] group-hover:text-[#C5A880] transition-colors duration-300">
                    {cat.title}
                  </h3>
                </div>
              </button>
            ))}
          </div>

          {/* Centered Browse CTA Button */}
          <div
            ref={buttonRef}
            className="flex justify-center mt-4 opacity-0"
          >
            <button
              type="button"
              onClick={() => {
                ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
                setLocation(allCollectionsPath);
              }}
              className="inline-block px-10 py-3 border border-[#C5A880] text-xs tracking-[0.2em] font-sans font-light uppercase text-[#1A1A1A] hover:bg-[#C5A880] hover:text-[#FAF9F6] transition-all duration-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880] cursor-pointer"
            >
              Browse All Collections
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
