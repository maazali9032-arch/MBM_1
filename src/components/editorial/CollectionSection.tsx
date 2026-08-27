import { CollectionItem } from './CollectionItem';
import { outfits } from '../../data/outfits';
import { siteContent } from '../../data/site';
import { useEffect } from 'react';
import gsap from 'gsap';


export const CollectionSection = () => {


  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    gsap.utils.toArray('.collection-item').forEach((el:any) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true,
          },
        }
      );
    });
  }, []);

  return (
    <section id="collection" className="py-24 bg-[#FAF9F6]" >
      <h2 className="text-center font-serif text-[clamp(2rem,5vw,4rem)] text-[#1A1A1A] mb-12">
        {siteContent.editorial.collectionTitle}
      </h2>
      <div className="space-y-24">
        {outfits.map((_, i) => (
          i === 2 ? null : (
            <div key={i} className="collection-item">
              <CollectionItem index={i} />
            </div>
          )
        ))}
      </div>
    </section>
  );
};
