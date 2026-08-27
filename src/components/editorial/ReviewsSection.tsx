import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reviews = [
  { name: "Adnan Khan", rating: 5, comment: "The best place in Tolichowki for wedding sherwanis. Excellent fabrics and perfect fits." },
  { name: "Rajesh Reddy", rating: 5, comment: "Superb custom tailoring! I got three suits stitched here, and the fitting was absolutely flawless." },
  { name: "Sameer Ahmed", rating: 5, comment: "Wide collection of premium kurta pajamas and Jodhpuri suits. Best fashion store in Hyderabad." },
  { name: "Vivek Sen", rating: 5, comment: "Highly professional service. They helped me choose the fabric and styled it precisely to my preference." },
  { name: "Mustafa Ali", rating: 5, comment: "Amazing catalog. From sherwani to formal suits, their craftsmanship is unmatched. 10/10." },
  { name: "Karan Johar", rating: 5, comment: "Incredible attention to detail. Mahek has been my go-to suiting house for years now." },
  { name: "Mohammed Imran", rating: 5, comment: "Extremely happy with my wedding outfit. Got so many compliments. Thank you, Nirmal Suiting House!" },
];

export const ReviewsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    if (!marqueeRef.current) return;

    let anim: gsap.core.Tween;

    const initMarquee = () => {
      if (!marqueeRef.current) return;
      const singleSetWidth = marqueeRef.current.scrollWidth / 3;
      if (singleSetWidth <= 0) return;

      anim = gsap.to(marqueeRef.current, {
        x: -singleSetWidth,
        ease: 'none',
        duration: 35, // Elegant scrolling speed
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize((x) => {
            const val = parseFloat(x);
            // Wrap seamlessly around singleSetWidth
            return val % singleSetWidth;
          })
        }
      });
    };

    const timer = setTimeout(initMarquee, 150);

    return () => {
      clearTimeout(timer);
      if (anim) anim.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="py-16 bg-[#1A1A1A] border-y border-[#C5A880]/20 overflow-hidden text-[#FAF9F6]"
    >
      <div className="max-w-screen-2xl mx-auto px-6 mb-8 text-center md:text-left md:flex md:items-center md:justify-between">
        <div>
          <span className="font-serif text-xs uppercase tracking-[0.2em] text-[#C5A880]">Google Reviews</span>
          <h2 className="font-serif text-2xl md:text-3xl mt-1 tracking-wider text-[#FAF9F6] uppercase">
            What Our Patrons Say
          </h2>
        </div>
        <div className="mt-4 md:mt-0 flex items-center justify-center md:justify-end gap-2">
          <div className="flex text-[#C5A880]">
            {"★".repeat(5)}
          </div>
          <span className="font-sans text-sm tracking-widest text-[#8C8C8C]">
            4.7 / 5 · 241 Google Reviews
          </span>
        </div>
      </div>

      {/* Marquee Track Container */}
      <div className="relative w-full overflow-hidden py-4 flex items-center">
        {/* Shadow Overlays for smooth edges */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#1A1A1A] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#1A1A1A] to-transparent z-10 pointer-events-none" />

        {/* Moving track synced with scroll */}
        <div
          ref={marqueeRef}
          className="flex gap-8 whitespace-nowrap pl-4 pr-4 transition-transform ease-out duration-300"
          style={{ willChange: 'transform' }}
        >
          {/* Double reviews to ensure seamless scrolling loops if width exceeds */}
          {[...reviews, ...reviews, ...reviews].map((rev, i) => (
            <div
              key={i}
              className="inline-block flex-shrink-0 bg-[#242424] border border-[#C5A880]/10 p-6 rounded-sm w-[300px] md:w-[350px] whitespace-normal"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-sans font-medium text-sm text-[#FAF9F6] tracking-wider">{rev.name}</span>
                <div className="flex text-[#C5A880] text-xs">
                  {"★".repeat(rev.rating)}
                </div>
              </div>
              <p className="font-sans text-xs md:text-sm text-[#8C8C8C] leading-relaxed italic">
                "{rev.comment}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
