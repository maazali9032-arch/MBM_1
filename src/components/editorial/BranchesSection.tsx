import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const branches = [
  {
    name: "Maqdoom's Big Mall",
    address: "22-7-177, Maqdoom Building, Pathergatti, Charminar Road, Hyderabad, Telangana 500002",
    phone: "040 6620 4666",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Maqdoom%27s+Big+Mall+Pathergatti+Hyderabad",
    image: "/images/Mahek.webp",
    avif: "/images/Mahek.avif",
  }
];

export const BranchesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    if (!containerRef.current || !headingRef.current || !cardsRef.current) return;

    const ctx = gsap.context(() => {
      // Fade in heading
      gsap.fromTo(headingRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true,
          }
        }
      );

      // Fade/slide in card columns
      gsap.fromTo(cardsRef.current!.children,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
            once: true,
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="contact"
      className="py-24 bg-[#FAF9F6] text-[#1A1A1A] overflow-hidden"
    >
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 lg:px-16">
        <h2
          ref={headingRef}
          className="font-serif text-[clamp(2rem,5vw,3.5rem)] text-center tracking-wider uppercase mb-16"
        >
          Visit Our Store
        </h2>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 max-w-3xl mx-auto gap-12 items-stretch"
        >
          {branches.map((branch, i) => (
            <div
              key={i}
              className="flex flex-col justify-between border border-[#C5A880]/10 bg-white p-8 md:p-12 rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
            >
              <div className="space-y-6">
                <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#C5A880]">Pathergatti · Hyderabad</span>
                <h3 className="font-serif text-xl md:text-2xl text-[#1A1A1A] tracking-wide uppercase">
                  {branch.name}
                </h3>
                
                {branch.image && (
                  <div className="w-full h-80 md:h-96 lg:h-[28rem] overflow-hidden rounded-sm mb-6 bg-neutral-50">
                    <picture className="block w-full h-full">
                      <source srcSet={branch.avif} type="image/avif" />
                      <img
                        src={branch.image}
                        alt={branch.name}
                        className="w-full h-full object-contain hover:scale-[1.02] transition-all duration-700 ease-out"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  </div>
                )}

                <div className="space-y-4 font-sans text-sm md:text-base text-[#8C8C8C] leading-relaxed">
                  <p className="flex items-start gap-3">
                    <span className="font-medium text-[#1A1A1A] flex-shrink-0 w-16">Address:</span>
                    <span>{branch.address}</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="font-medium text-[#1A1A1A] flex-shrink-0 w-16">Phone:</span>
                    <a href={`tel:${branch.phone.replace(/\s+/g, '')}`} className="text-[#C5A880] hover:underline">
                      {branch.phone}
                    </a>
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#FAF9F6]">
                <a
                  href={branch.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-[#C5A880] text-xs tracking-[0.2em] font-sans font-light uppercase text-[#1A1A1A] hover:bg-[#C5A880] hover:text-[#FAF9F6] transition-all duration-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                >
                  Get Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
