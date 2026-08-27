import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

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

    return () => ctx.revert();
  }, []);

  const goToCategory = (categoryId: string) => {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    ScrollTrigger.clearScrollMemory();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    setLocation(`/collections?category=${categoryId}`);
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
            className="flex items-center gap-6 md:gap-10 h-[80%] flex-nowrap overflow-x-hidden relative z-20"
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
                setLocation('/collections');
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
