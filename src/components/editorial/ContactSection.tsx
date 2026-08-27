import { siteContent } from '../../data/site';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';


export const ContactSection = () => {
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

  const { business, hours, editorial } = siteContent;

  return (
    <section id="contact" ref={sectionRef} className="py-24 bg-[#FAF9F6] text-[#1A1A1A]">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-16 space-y-6">
        <h2 className="text-center font-serif text-[clamp(2rem,5vw,3.5rem)] mb-4 whitespace-pre-line">
          {editorial.contact.heading}
        </h2>
        <p className="text-center text-base">
          {business.name}<br />
          {business.addressLines.map((line, i) => (
            <span key={i}>{line}<br /></span>
          ))}
        </p>
        <p className="text-center mt-2">
          Phone:{' '}
          <a href={`tel:${business.phone}`} className="text-[#C5A880] hover:underline focus:outline-none focus:ring-2 focus:ring-[#C5A880]">
            {business.phone}
          </a>
        </p>
        <p className="text-center mt-2">
          Rating: {business.rating} / 5 · {business.reviewCount} Google reviews
        </p>
        <div className="text-center mt-4 space-x-4">
          <a href="tel:+919618355071" className="inline-block px-4 py-2 border border-[#C5A880] text-[#C5A880] rounded hover:bg-[#C5A880]/10 focus:outline-none focus:ring-2 focus:ring-[#C5A880]">
            {editorial.contact.ctaCall}
          </a>
          <a href={business.googleMaps} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 border border-[#C5A880] text-[#C5A880] rounded hover:bg-[#C5A880]/10 focus:outline-none focus:ring-2 focus:ring-[#C5A880]">
            {editorial.contact.ctaDirections}
          </a>
          <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 border border-[#C5A880] text-[#C5A880] rounded hover:bg-[#C5A880]/10 focus:outline-none focus:ring-2 focus:ring-[#C5A880]">
            Instagram
          </a>
          <a href={business.website} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 border border-[#C5A880] text-[#C5A880] rounded hover:bg-[#C5A880]/10 focus:outline-none focus:ring-2 focus:ring-[#C5A880]">
            Website
          </a>
          <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 border border-[#C5A880] text-[#C5A880] rounded hover:bg-[#C5A880]/10 focus:outline-none focus:ring-2 focus:ring-[#C5A880]">
            Facebook
          </a>
        </div>
        <div className="mt-6 text-center">
          <h3 className="font-semibold uppercase tracking-widest text-[#8C8C8C] mb-2">Store Hours</h3>
            <dl className="mx-auto grid max-w-md gap-2 text-left">
              {Object.entries(hours).map(([day, time]) => (
                <div key={day} className="flex justify-between border-b border-[#E0E0E0] pb-1">
                  <dt className="font-medium capitalize text-[#8C8C8C]">{day}</dt>
                  <dd className="text-[#1A1A1A]">{time}</dd>
                </div>
              ))}
            </dl>
        </div>
      </div>
    </section>
  );
};
