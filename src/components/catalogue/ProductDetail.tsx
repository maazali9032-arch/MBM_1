import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { siteContent } from '../../data/site';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import { collectionFilterPath } from '../../lib/collectionRoutes';

const fetchProductDetail = async (productCode: string) => {
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('product_code', productCode)
    .single();

  if (prodError) throw prodError;
  if (!product) return null;

  const { data: images, error: imgError } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', product.id)
    .order('display_order', { ascending: true });

  if (imgError) throw imgError;

  return { ...product, product_images: images || [] };
};

export const ProductDetail = ({ params }: { params: { code: string } }) => {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const touchStartX = useRef(0);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', params.code],
    queryFn: () => fetchProductDetail(params.code),
    enabled: !!params.code,
  });

  const images = product?.product_images || [];

  const goToImage = useCallback((index: number) => {
    const max = images.length - 1;
    const next = Math.max(0, Math.min(index, max));
    setActiveImgIndex(next);
    setFullscreenIndex(next);
  }, [images.length]);

  const handleSwipeEnd = (clientX: number) => {
    if (fullscreenIndex === null || images.length <= 1) return;
    const diff = clientX - touchStartX.current;
    if (Math.abs(diff) < 50) return;
    if (diff < 0) goToImage(fullscreenIndex + 1);
    else goToImage(fullscreenIndex - 1);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [params.code]);

  useEffect(() => {
    const shouldHide = fullscreenIndex !== null;
    if (shouldHide) {
      document.body.classList.add('hide-whatsapp-fab');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('hide-whatsapp-fab');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('hide-whatsapp-fab');
      document.body.style.overflow = '';
    };
  }, [fullscreenIndex]);

  useEffect(() => {
    if (fullscreenIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreenIndex(null);
      if (e.key === 'ArrowRight') goToImage(fullscreenIndex + 1);
      if (e.key === 'ArrowLeft') goToImage(fullscreenIndex - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreenIndex, goToImage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-sans text-sm tracking-widest text-[#8C8C8C]">
        LOADING PRODUCT DETAILS...
      </div>
    );
  }

  if (!product || isError || !product.is_active) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="font-serif text-3xl mb-4">Product Not Found</h2>
        <p className="text-sm text-[#8C8C8C] mb-6">The product you are trying to view is no longer available or does not exist.</p>
        <Link href="/" className="px-6 py-2 border border-[#C5A880] text-xs uppercase tracking-widest hover:bg-[#C5A880] hover:text-[#FAF9F6] transition-colors">
          Return to Showroom
        </Link>
      </div>
    );
  }

  const categoryName = product.categories?.name || 'Collection';
  const categorySlug = product.categories?.slug || '';
  const displayName = product.name || `${categoryName} ${product.product_code}`;

  const number = siteContent.business.phone.replace(/[^0-9]/g, '');
  const inquiryText = `Hi, I am interested in inquiring about the custom ${displayName} (Code: ${product.product_code}) under the ${categoryName} collection.`;
  const whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent(inquiryText)}`;

  const activeImage = images[activeImgIndex]?.public_url || '/images/SHW1.webp';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans pb-24 relative">
      <header className="sticky top-0 bg-[#111111] z-40 border-b border-[#C5A880]/30 py-6 px-6 md:px-12 flex justify-between items-center">
        <Link href={collectionFilterPath(categorySlug)} className="text-xs tracking-[0.2em] uppercase text-[#FAF9F6]/80 hover:text-[#C5A880] transition-colors duration-300">
          ← BACK TO {categoryName.toUpperCase()}
        </Link>
        <a href="/" className="inline-flex items-center" aria-label="Maqdoom's Big Mall home">
          <img src="/LOGO.png" alt="Maqdoom's Big Mall" className="h-8 md:h-10 w-auto object-contain" decoding="async" />
        </a>
        <div className="w-20 hidden md:block" />
      </header>

      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 lg:px-16 pt-12 md:pt-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">

          <div className="w-full lg:w-3/5 space-y-6">
            <button
              type="button"
              onClick={() => setFullscreenIndex(activeImgIndex)}
              className="w-full aspect-[3/4] bg-white border border-[#C5A880]/10 rounded-sm overflow-hidden relative shadow-sm cursor-zoom-in block"
              aria-label="View fullscreen"
            >
              <img
                src={activeImage}
                alt={displayName}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <div className="absolute top-4 left-4 bg-black/40 text-[#FAF9F6] text-[10px] tracking-widest px-3 py-1 rounded-sm uppercase">
                {product.product_code}
              </div>
              {images.length > 0 && (
                <span className="absolute bottom-3 right-3 text-[9px] tracking-widest uppercase bg-black/50 text-white px-2 py-1 rounded-sm">
                  Tap to enlarge
                </span>
              )}
            </button>

            {images.length > 1 && (
              <div className="flex gap-3 sm:gap-4 overflow-x-auto py-1">
                {images.map((img: { id: string; public_url: string }, idx: number) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    className={`flex-shrink-0 w-16 h-20 sm:w-20 sm:h-20 border-2 rounded-sm overflow-hidden transition-all duration-300 cursor-pointer ${
                      activeImgIndex === idx
                        ? 'border-[#C5A880] scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.public_url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-full lg:w-2/5 space-y-6 sm:space-y-8 lg:sticky lg:top-32">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] block mb-1">
                {categoryName} Collection
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1A1A1A] leading-tight uppercase tracking-wide">
                {displayName}
              </h2>
            </div>

            <div className="w-16 h-[1px] bg-[#C5A880]" />

            {product.description && (
              <p className="text-sm font-light text-[#8C8C8C] leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="space-y-3 border-y border-neutral-200/50 py-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-xs sm:text-sm">
                <span className="font-semibold text-[#1A1A1A] uppercase tracking-widest shrink-0">Outfit Code</span>
                <span className="text-[#8C8C8C]">{product.product_code}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-xs sm:text-sm">
                <span className="font-semibold text-[#1A1A1A] uppercase tracking-widest shrink-0">Bespoke Fit</span>
                <span className="text-[#8C8C8C]">Custom tailoring (Trial session included)</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-xs sm:text-sm">
                <span className="font-semibold text-[#1A1A1A] uppercase tracking-widest shrink-0">Location</span>
                <span className="text-[#8C8C8C]">Available at our Pathergatti store</span>
              </div>
            </div>

            <div className="space-y-3 pt-2 sm:pt-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-sans text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <WhatsAppIcon className="w-5 h-5 shrink-0" />
                Inquire via WhatsApp
              </a>

              <Link href={collectionFilterPath(categorySlug)} className="w-full py-4 border border-[#C5A880] text-[#1A1A1A] hover:bg-[#C5A880]/5 font-sans text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase rounded-sm flex items-center justify-center transition-colors duration-300">
                Back to Collection
              </Link>
            </div>
          </div>

        </div>
      </section>

      {fullscreenIndex !== null && images.length > 0 && (
        <div
          className="fixed inset-0 z-[70] bg-black flex flex-col"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => handleSwipeEnd(e.changedTouches[0].clientX)}
        >
          <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white shrink-0">
            <span className="text-xs tracking-widest uppercase text-white/70">
              {fullscreenIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setFullscreenIndex(null)}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
              aria-label="Close fullscreen"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center min-h-0 px-2 pb-4">
            {fullscreenIndex > 0 && (
              <button
                type="button"
                onClick={() => goToImage(fullscreenIndex - 1)}
                className="hidden sm:flex absolute left-3 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white items-center justify-center cursor-pointer"
                aria-label="Previous image"
              >
                ‹
              </button>
            )}

            <img
              src={images[fullscreenIndex]?.public_url}
              alt={`${displayName} fullscreen ${fullscreenIndex + 1}`}
              className="max-w-full max-h-[calc(100vh-8rem)] object-contain mx-auto select-none"
              draggable={false}
            />

            {fullscreenIndex < images.length - 1 && (
              <button
                type="button"
                onClick={() => goToImage(fullscreenIndex + 1)}
                className="hidden sm:flex absolute right-3 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white items-center justify-center cursor-pointer"
                aria-label="Next image"
              >
                ›
              </button>
            )}
          </div>

          {images.length > 1 && (
            <p className="text-center text-[10px] tracking-widest uppercase text-white/50 pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0">
              Swipe left or right to browse
            </p>
          )}
        </div>
      )}

    </div>
  );
};
export default ProductDetail;
