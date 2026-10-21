import { outfits } from '../../data/outfits';
import { useBreakpoint } from '../../hooks/useBreakpoint';


export const CollectionItem = ({ index }: { index: number }) => {
  const outfit = outfits[index];
  const breakpoint = useBreakpoint();
  const isEven = index % 2 === 1; // 0-based index: even positions (0,2) left image, odd right image

  const containerClass =
    breakpoint.current === 'mobile'
      ? 'flex flex-col items-center text-center gap-4'
      : `flex ${isEven ? 'flex-row-reverse' : 'flex-row'} items-center gap-8`;

  const imageClass =
    breakpoint.current === 'mobile'
      ? 'w-full h-auto object-cover'
      : 'w-1/2 h-auto object-cover';

  const textClass =
    breakpoint.current === 'mobile'
      ? 'w-full'
      : 'w-1/2 px-4';

  const numbering = (`0${index + 1}`).slice(-2);

  return (
    <section id={`garment-${outfit.id}`} className={containerClass}>
      <picture>
        <source
          srcSet={outfit.posterSrc.replace(/\.webp$/, '.avif')}
          type="image/avif"
        />
        <img
          src={outfit.posterSrc}
          alt={`${outfit.title} – Maqdoom's Big Mall collection`}
          className={imageClass}
          loading="lazy"
          decoding="async"
        />
      </picture>
      <div className={textClass}>
        <p className="text-sm uppercase tracking-widest text-[#8C8C8C] mb-1">{numbering}</p>
        <h2 className="font-serif text-[clamp(1.5rem,4vw,3rem)] text-[#1A1A1A] mb-2">{outfit.title}</h2>
        <p className="text-base text-[#1A1A1A] max-w-md whitespace-pre-line">
          {outfit.description}
        </p>
      </div>
    </section>
  );
};
