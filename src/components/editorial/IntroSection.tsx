import { useEffect, useRef } from 'react';
import gsap from 'gsap';

import { siteContent } from '../../data/site';

export const IntroSection = () => {
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
    <section id="intro" ref={sectionRef} className="py-24 px-4 md:px-8 lg:px-16 max-w-screen-2xl mx-auto text-center bg-[#FAF9F6]">
      <p className="text-sm uppercase tracking-widest text-[#8C8C8C] mb-2">{siteContent.editorial.intro.eyebrow}</p>
      <h1 className="font-serif text-[clamp(2rem,6vw,4rem)] leading-tight text-[#1A1A1A] mb-4 whitespace-pre-line">
        {siteContent.editorial.intro.heading}
      </h1>
      <p className="text-base md:text-lg text-[#1A1A1A] max-w-2xl mx-auto whitespace-pre-line">
        {siteContent.editorial.intro.copy}
      </p>
    </section>
  );
};
