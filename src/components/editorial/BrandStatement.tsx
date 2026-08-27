import { siteContent } from '../../data/site';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';


export const BrandStatement = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const el = sectionRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.8,
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
    <section id="brand" ref={sectionRef} className="py-32 bg-[#1A1A1A] text-[#FAF9F6] text-center">
      <h2 className="font-serif text-[clamp(2.5rem,6vw,5rem)] whitespace-pre-line">
        {siteContent.editorial.brandStatement}
      </h2>
    </section>
  );
};
