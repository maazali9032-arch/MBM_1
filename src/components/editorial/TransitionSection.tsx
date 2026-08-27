import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { siteContent } from '../../data/site';

export const TransitionSection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const el = sectionRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, scale: 1.04 },
      {
        opacity: 1,
        scale: 1,
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
    <section
      ref={sectionRef}
      className="py-32 bg-[#FAF9F6] text-center"
    >
      <h2 className="font-serif text-[clamp(2rem,6vw,4rem)] text-[#1A1A1A] mb-4">
        {siteContent.editorial.collectionTitle}
      </h2>
    </section>
  );
};
