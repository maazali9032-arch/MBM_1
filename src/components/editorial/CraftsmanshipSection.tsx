import { siteContent } from '../../data/site';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { craftImages } from '../../data/craftsmanship';

export const CraftsmanshipSection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const el = sectionRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none',
          once: true,
        },
      }
    );
  }, []);



  return (
    <section id="craftsmanship" ref={sectionRef} className="py-24 bg-[#FAF9F6]">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-16 space-y-24">
        <p className="text-sm uppercase tracking-widest text-[#8C8C8C] mb-2 text-center">
          {siteContent.editorial.craftsmanship.eyebrow}
        </p>
        <h2 className="font-serif text-[clamp(2rem,5vw,4rem)] text-center text-[#1A1A1A] mb-8 whitespace-pre-line">
          {siteContent.editorial.craftsmanship.heading}
        </h2>
        {craftImages.map((img, i) => (
          <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8`}
               style={{ gridRow: i % 3 === 0 ? 'span 2' : 'span 1' }}>
            <picture className="flex-1">
              <source srcSet={img.src.replace(/\.avif$/, '.webp')} type="image/webp" />
              <img src={img.src} alt={img.alt} className="w-full h-auto object-cover" loading="lazy" decoding="async" />
            </picture>
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm uppercase tracking-widest text-[#8C8C8C] mb-1">{img.caption.split(' – ')[0]}</p>
              <p className="text-base text-[#1A1A1A] max-w-md mx-auto md:mx-0">{img.caption.split(' – ')[1]}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
