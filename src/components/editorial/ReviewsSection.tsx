import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reviews = [
  {
    name: "P. Rampurshotham Reddy",
    rating: 5,
    comment: "Excellent collection of linen fabrics with impressive variety. Mr. Chirag was welcoming and professional, and Tauseef bhai patiently helped me explore multiple options and ensured a smooth billing process. Great pricing and an overall pleasant experience — looking forward to visiting again.",
  },
  {
    name: "Mohammad Anees",
    rating: 5,
    comment: "Fabric collection and staff behaviour was very good, stitching was also done in 2 days. I'd recommend anyone looking for decent looks can visit.",
  },
  {
    name: "Mujtaba GM",
    rating: 5,
    comment: "Nirmal Suiting House (Mahek) truly stands out for its quality fabrics, excellent stitching, and professional service. The staff is very cooperative and understands customer requirements perfectly. Timely delivery and great attention to detail make it a highly reliable place for premium suiting. Highly recommended.",
  },
  {
    name: "PD Pawde",
    rating: 5,
    comment: "I stitched my suit from here and I’m very satisfied with the fitting and quality. The staff was polite and understood my design properly. Excellent service and on-time delivery. Thank you Nirmal suit house team.",
  },
  {
    name: "Gauri A Koustubhan",
    rating: 5,
    comment: "I got a 2 piece suit stitched for my son who is lean and tall! He was very happy with the fitting and he looked good in the suit! Thank you Nirmal suiting house for making my good looking son look more handsome!!",
  },
  {
    name: "Annalilia Balboa",
    rating: 5,
    comment: "Loved it! I was initially a little skeptical on how the suit was going to turn out but I was blown away with how it came out. Loved their suggestions and the timely way the suit was made. Would definitely buy again.",
  },
  {
    name: "Nihar Mp",
    rating: 5,
    comment: "Amazing experience with them. Perfect fit and stitching, and great attention to detail. Delivered on time and exactly as I wanted.",
  },
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
            4.7 / 5 · 233 Google Reviews
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
