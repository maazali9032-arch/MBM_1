import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { siteContent } from '../../data/site';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import {
  fetchActiveCategories,
  fetchCatalogueProducts,
  PRODUCTS_PAGE_SIZE,
  type CatalogueProduct,
} from '../../lib/catalogueQueries';
import { allCollectionsPath, openCollection } from '../../lib/collectionRoutes';

type CollectionItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  desc: string;
  fabric: string;
  images: string[];
  avifs: string[];
};

const collectionsData: CollectionItem[] = [
  {
    id: 'sherwani',
    slug: 'sherwanis',
    title: 'Sherwani',
    subtitle: 'Royal Couture & Handcraft',
    desc: 'Exquisite hand-embellished wedding sherwanis. Tailored using premium raw silks, velvet lapels, and custom zardosi work for grooms who command presence.',
    fabric: 'Raw Silk, Banarasi Brocade, Premium Velvet',
    images: ['/images/SHW1.webp', '/images/SHW2.webp', '/images/SHW3.webp'],
    avifs: ['/images/SHW1.avif', '/images/SHW2.avif', '/images/SHW3.avif'],
  },
  {
    id: 'suit',
    slug: 'suits',
    title: 'Bespoke Suit',
    subtitle: 'Modern Formality & Precision',
    desc: 'Two-piece and three-piece custom stitched suits. Masterfully cut from Italian fabrics, worsted wool, and linen blends to deliver sharp profiles.',
    fabric: 'Italian Wool, Worsted Wool, Linen Club blends',
    images: ['/images/SUT1.webp', '/images/SUT2.webp', '/images/SUT3.webp'],
    avifs: ['/images/SUT1.avif', '/images/SUT2.avif', '/images/SUT3.avif'],
  },
  {
    id: 'bandgala',
    slug: 'bandgalas',
    title: 'Bandgala',
    subtitle: 'Heritage Imperial Silhouettes',
    desc: 'The classic Indian court suit, blending royal heritage with contemporary fit. Styled with structured shoulders and high collars.',
    fabric: 'Suede velvet, Premium Cashmere, Silk Brocades',
    images: ['/images/Bandhgala.jpeg', '/images/SHW2.webp', '/images/SHW3.webp'],
    avifs: ['', '/images/SHW2.avif', '/images/SHW3.avif'],
  },
  {
    id: 'jodhpuri',
    slug: 'jodhpuris',
    title: 'Jodhpuri Suit',
    subtitle: 'Elite Occasion Dressing',
    desc: 'A timeless fusion of Rajasthani legacy and European tailoring. Complemented by contrast trousers and customized metallic buttons.',
    fabric: 'Jodhpur Suede, Merino Wool, Imported Twill',
    images: ['/images/JSUT.webp', '/images/SUT1.webp', '/images/SUT3.webp'],
    avifs: ['/images/JSUT.avif', '/images/SUT1.avif', '/images/SUT3.avif'],
  },
  {
    id: 'kurta',
    slug: 'kurta-pajamas',
    title: 'Kurta Pajama',
    subtitle: 'Effortless Festive Simplicity',
    desc: 'Soft linen kurtas, lucknowi chikan embroidery, and classic draped pajamys. Breathable silhouettes perfect for festivals and pre-wedding functions.',
    fabric: 'Pure Linen, Bhagalpuri Silk, Cotton Mulmul',
    images: ['/images/KP1.webp', '/images/KP2.webp', '/images/KP3.webp'],
    avifs: ['/images/KP1.avif', '/images/KP2.avif', '/images/KP3.avif'],
  },
  {
    id: 'nehru',
    slug: 'nehru-jackets',
    title: 'Nehru Jacket',
    subtitle: 'Layered Dapper Sartorials',
    desc: 'Versatile bandhgala waistcoats. Perfect for layering over linen kurtas or formal shirts to add a sophisticated touch of tradition.',
    fabric: 'Matka Silk, Handloom Khadi, Linen-Cotton',
    images: ['/images/Nehru jacket.jpeg', '/images/KP2.webp', '/images/KP3.webp'],
    avifs: ['', '/images/KP2.avif', '/images/KP3.avif'],
  },
  {
    id: 'formal',
    slug: 'formals',
    title: 'Formal Outfit',
    subtitle: 'Executive Wardrobe & Blazers',
    desc: 'Custom shirting, trousers, and double-breasted blazers. Tailored to perfection for daily boardroom authority and evening socials.',
    fabric: 'Giza Cotton, Super 120s Wool, Premium Lycra blends',
    images: ['/images/formal outfit.jpeg', '/images/SUT3.webp', '/images/SUT2.webp'],
    avifs: ['', '/images/SUT3.avif', '/images/SUT2.avif'],
  },
  {
    id: 'pathani',
    slug: 'pathanis',
    title: 'Pathani Suit',
    subtitle: 'Robust Traditional Attitude',
    desc: 'Aggressively cut collared Pathani kurtas paired with matching salwars. Made from heavy cottons and crisp linens to hold structure.',
    fabric: 'Heavy Linen, Structured Khadi-Cotton, Twill Cotton',
    images: ['/images/pathani.jpeg', '/images/IW2.webp', '/images/IW3.webp'],
    avifs: ['', '/images/IW2.avif', '/images/IW3.avif'],
  },
];

export const CollectionsPage = () => {
  const [location] = useLocation();
  const search = useSearch();

  const [activeItem, setActiveItem] = useState<CollectionItem | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const touchStartX = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filteredCollections = useMemo(() => {
    if (activeFilter === 'all') return collectionsData;
    return collectionsData.filter((item) => item.id === activeFilter);
  }, [activeFilter]);

  const { data: dbCategories } = useQuery({
    queryKey: ['categories', 'collections'],
    queryFn: fetchActiveCategories,
  });

  const activeCategoryId = useMemo(() => {
    if (activeFilter === 'all') return null;
    const meta = collectionsData.find((c) => c.id === activeFilter);
    if (!meta) return null;
    return dbCategories?.find((c: { slug: string; id: string }) => c.slug === meta.slug)?.id ?? null;
  }, [activeFilter, dbCategories]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data: productPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingProducts,
  } = useInfiniteQuery({
    queryKey: ['collections-products', activeCategoryId, debouncedSearch, activeFilter],
    queryFn: ({ pageParam = 0 }) => {
      if (activeFilter !== 'all' && !activeCategoryId) return Promise.resolve([]);
      return fetchCatalogueProducts({
        pageParam,
        categoryId: activeCategoryId,
        search: debouncedSearch,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PRODUCTS_PAGE_SIZE ? allPages.length : undefined,
    enabled: dbCategories !== undefined && (activeFilter === 'all' || !!activeCategoryId),
  });

  const productsList = useMemo(() => productPages?.pages.flat() ?? [], [productPages]);

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1, rootMargin: '120px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, productsList.length]);

  const applyFilter = (filterId: string) => {
    setActiveFilter(filterId);
    if (filterId === 'all') {
      window.location.assign(allCollectionsPath);
      return;
    }
    openCollection(filterId);
  };

  useEffect(() => {
    const params = new URLSearchParams(search);
    const category = params.get('category');
    if (category && collectionsData.some((c) => c.id === category)) {
      setActiveFilter(category);
    } else {
      setActiveFilter('all');
    }
  }, [location, search]);

  useEffect(() => {
    if (activeItem && activeFilter !== 'all' && activeItem.id !== activeFilter) {
      setActiveItem(null);
      setFullscreenIndex(null);
    }
  }, [activeFilter, activeItem]);

  useEffect(() => {
    const shouldHide = !!activeItem || fullscreenIndex !== null;
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
  }, [activeItem, fullscreenIndex]);

  const openCategoryLookbook = (item: CollectionItem) => {
    setActiveItem(item);
    setActiveGalleryIndex(0);
    setFullscreenIndex(null);
  };

  const handleCategoryInquiry = (item: CollectionItem) => {
    const number = siteContent.business.phone.replace(/[^0-9]/g, '');
    const message = `Hi, I'm interested in inquiring about your ${item.title} collection at Maqdoom's Big Mall.\n\nCategory: ${item.subtitle}\nCollection code: ${item.slug}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleProductInquiry = (product: CatalogueProduct) => {
    const categoryName = product.categories?.name || 'Collection';
    const title = product.name || `${categoryName} ${product.product_code}`;
    const number = siteContent.business.phone.replace(/[^0-9]/g, '');
    const message = `Hi, I'm interested in inquiring about a design at Maqdoom's Big Mall.\n\nProduct: ${title}\nCode: ${product.product_code}\nCategory: ${categoryName}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const goToImage = useCallback(
    (index: number) => {
      if (!activeItem) return;
      const max = activeItem.images.length - 1;
      const next = Math.max(0, Math.min(index, max));
      setActiveGalleryIndex(next);
      setFullscreenIndex(next);
    },
    [activeItem]
  );

  const handleSwipeEnd = (clientX: number) => {
    if (fullscreenIndex === null || !activeItem) return;
    const diff = clientX - touchStartX.current;
    if (Math.abs(diff) < 50) return;
    if (diff < 0) goToImage(fullscreenIndex + 1);
    else goToImage(fullscreenIndex - 1);
  };

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

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans pb-24 relative">
      <header className="sticky top-0 bg-[#111111] z-40 border-b border-[#C5A880]/30 py-6 px-6 md:px-12 flex justify-between items-center">
        <a
          href="/"
          className="font-sans text-xs tracking-[0.2em] uppercase text-[#FAF9F6]/80 hover:text-[#C5A880] transition-colors duration-300 flex items-center gap-2"
        >
          <span>←</span> Back to Showroom
        </a>
        <a href="/" className="inline-flex items-center" aria-label="Maqdoom's Big Mall home">
          <img src="/Logo.png" alt="Maqdoom's Big Mall" className="h-8 md:h-10 w-auto object-contain" decoding="async" />
        </a>
        <div className="w-20 hidden md:block" />
      </header>

      <section className="py-10 md:py-14 text-center max-w-4xl mx-auto px-6">
        <span className="font-sans text-xs uppercase tracking-[0.25em] text-[#C5A880] mb-2 block">Bespoke Couture</span>
        <h2 className="font-serif text-[clamp(2rem,6vw,4rem)] uppercase tracking-wide text-[#1A1A1A]">
          The Collections
        </h2>
        <div className="w-16 h-[1px] bg-[#C5A880] mx-auto my-4 md:my-6" />
        <p className="font-sans text-sm md:text-base font-light text-[#8C8C8C] leading-relaxed">
          From ceremonial royal sherwanis to sharply tailored Italian suits, explore custom-fitted wardrobes from Maqdoom's Big Mall.
        </p>
      </section>

      {/* Search + horizontal category filter */}
      <section className="sticky top-[65px] sm:top-[73px] z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#C5A880]/15">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 py-3 md:py-4 space-y-3">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, code, or fabric..."
            className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-[#C5A880]"
            aria-label="Search products"
          />

          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5 snap-x">
            <button
              type="button"
              onClick={() => applyFilter('all')}
              className={`snap-start shrink-0 px-3.5 py-1.5 text-[10px] sm:text-xs tracking-[0.12em] uppercase rounded-full border cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]'
                  : 'bg-white text-[#8C8C8C] border-neutral-200 hover:border-[#C5A880]'
              }`}
            >
              All
            </button>
            {collectionsData.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applyFilter(item.id)}
                className={`snap-start shrink-0 px-3.5 py-1.5 text-[10px] sm:text-xs tracking-[0.12em] uppercase rounded-full border cursor-pointer whitespace-nowrap ${
                  activeFilter === item.id
                    ? 'bg-[#C5A880] text-[#FAF9F6] border-[#C5A880]'
                    : 'bg-white text-[#8C8C8C] border-neutral-200 hover:border-[#C5A880]'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category cards — image/title opens lookbook, single Enquiry button */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 pt-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
          {filteredCollections.map((item) => {
            const originalIndex = collectionsData.findIndex((c) => c.id === item.id);
            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between border border-[#C5A880]/10 bg-white rounded-sm p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-[#C5A880]/30 transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => openCategoryLookbook(item)}
                  className="space-y-3 text-left w-full cursor-pointer"
                  aria-label={`Open ${item.title} lookbook`}
                >
                  <div className="aspect-[3/4] w-full overflow-hidden rounded-sm bg-neutral-100 relative">
                    <picture className="block w-full h-full">
                      {item.avifs[0] && <source srcSet={item.avifs[0]} type="image/avif" />}
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-all duration-500"
                        loading="lazy"
                      />
                    </picture>
                  </div>

                  <div className="px-0.5">
                    <div className="flex justify-between items-center mb-1 gap-2">
                      <span className="font-sans text-[10px] sm:text-xs tracking-widest text-[#8C8C8C]">
                        {String(originalIndex + 1).padStart(2, '0')}
                      </span>
                      <span className="font-sans text-[9px] sm:text-[10px] tracking-[0.12em] uppercase text-[#C5A880] text-right line-clamp-1">
                        {item.subtitle}
                      </span>
                    </div>
                    <h3 className="font-serif text-base sm:text-lg text-[#1A1A1A] group-hover:text-[#C5A880] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-[#8C8C8C] font-light line-clamp-2 mt-1.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryInquiry(item)}
                  className="mt-4 w-full py-2.5 sm:py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] rounded-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  Enquiry
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Products from database */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 pt-10 pb-6">
        <h3 className="font-serif text-lg sm:text-xl uppercase tracking-wide text-[#1A1A1A] mb-5">
          {activeFilter === 'all' ? 'All Designs' : `${filteredCollections[0]?.title ?? ''} Designs`}
        </h3>

        {loadingProducts ? (
          <div className="text-center py-16 text-xs tracking-widest text-[#8C8C8C]">LOADING PRODUCTS...</div>
        ) : productsList.length === 0 ? (
          <div className="text-center py-16 text-sm text-[#8C8C8C] font-light">
            {debouncedSearch.length >= 2 ? 'No products match your search.' : 'No active products in this collection yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {productsList.map((product) => {
              const primaryImage = product.product_images?.[0]?.public_url || '/images/SHW1.webp';
              const displayName = product.name || `${product.categories?.name || 'Design'} ${product.product_code}`;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col justify-between border border-[#C5A880]/10 bg-white p-2.5 sm:p-3 rounded-sm shadow-sm hover:shadow-md transition-all"
                >
                  <Link href={`/products/${product.product_code}`} className="space-y-2 sm:space-y-3 block">
                    <div className="aspect-[3/4] overflow-hidden rounded-sm bg-neutral-100">
                      <img src={primaryImage} alt={displayName} className="w-full h-full object-cover group-hover:scale-102 transition-all duration-500" loading="lazy" />
                    </div>
                    <div className="px-0.5">
                      <p className="text-[9px] sm:text-[10px] tracking-widest text-[#8C8C8C] truncate">{product.product_code}</p>
                      <h4 className="font-serif text-sm sm:text-base text-[#1A1A1A] group-hover:text-[#C5A880] line-clamp-2 leading-snug">{displayName}</h4>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleProductInquiry(product)}
                    className="mt-3 w-full py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[10px] sm:text-xs uppercase tracking-widest font-semibold rounded-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    Enquiry
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div ref={sentinelRef} className="h-16 flex items-center justify-center mt-8">
          {isFetchingNextPage && (
            <span className="text-xs tracking-widest text-[#8C8C8C] animate-pulse">LOADING MORE...</span>
          )}
        </div>
      </section>

      {/* Lookbook modal */}
      {activeItem && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-5xl bg-[#FAF9F6] rounded-t-sm sm:rounded-sm shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[95vh] relative border border-[#C5A880]/20">
            <button
              type="button"
              onClick={() => { setActiveItem(null); setFullscreenIndex(null); }}
              className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="w-full md:w-1/2 min-h-[35vh] md:min-h-0 md:h-[65vh] flex flex-col bg-neutral-900">
              <button
                type="button"
                onClick={() => setFullscreenIndex(activeGalleryIndex)}
                className="flex-1 relative overflow-hidden cursor-zoom-in"
                aria-label="View fullscreen"
              >
                <picture className="block w-full h-full">
                  {activeItem.avifs[activeGalleryIndex] && (
                    <source srcSet={activeItem.avifs[activeGalleryIndex]} type="image/avif" />
                  )}
                  <img
                    src={activeItem.images[activeGalleryIndex]}
                    alt={activeItem.title}
                    className="w-full h-full object-cover"
                  />
                </picture>
                <span className="absolute bottom-3 left-3 text-[9px] tracking-widest uppercase bg-black/50 text-white px-2 py-1 rounded-sm">
                  Tap to enlarge
                </span>
              </button>

              <div className="p-2 flex gap-2 overflow-x-auto bg-[#111] border-t border-white/5">
                {activeItem.images.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveGalleryIndex(index)}
                    className={`w-11 h-11 shrink-0 rounded-sm overflow-hidden border-2 cursor-pointer ${
                      activeGalleryIndex === index ? 'border-[#C5A880]' : 'border-transparent opacity-50'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full md:w-1/2 p-5 sm:p-8 flex flex-col justify-between overflow-y-auto flex-1 min-h-0 pb-8">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] sm:text-xs tracking-widest text-[#C5A880] uppercase block mb-1">{activeItem.subtitle}</span>
                  <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide">{activeItem.title}</h2>
                </div>
                <div className="w-12 h-[1px] bg-[#C5A880]" />
                <p className="text-sm font-light text-[#8C8C8C] leading-relaxed">{activeItem.desc}</p>
                <div className="space-y-2 text-xs sm:text-sm text-[#8C8C8C]">
                  <p><span className="font-semibold text-[#1A1A1A] uppercase tracking-widest">Available at: </span>Maqdoom's Big Mall, Pathergatti</p>
                  <p><span className="font-semibold text-[#1A1A1A] uppercase tracking-widest">Fabrics: </span>{activeItem.fabric}</p>
                  <p><span className="font-semibold text-[#1A1A1A] uppercase tracking-widest">Fittings: </span>Bespoke custom fittings (Trial session included)</p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-neutral-100 space-y-3">
                <button
                  type="button"
                  onClick={() => handleCategoryInquiry(activeItem)}
                  className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-sm flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <WhatsAppIcon className="w-5 h-5 shrink-0" />
                  Enquiry via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveItem(null); setFullscreenIndex(null); }}
                  className="w-full py-3 border border-[#C5A880] text-xs uppercase tracking-[0.15em] rounded-sm cursor-pointer hover:bg-[#C5A880]/10"
                >
                  Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen swipeable gallery */}
      {activeItem && fullscreenIndex !== null && (
        <div
          className="fixed inset-0 z-[70] bg-black flex flex-col"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => handleSwipeEnd(e.changedTouches[0].clientX)}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-xs tracking-widest uppercase text-white/70">
              {fullscreenIndex + 1} / {activeItem.images.length}
            </span>
            <button type="button" onClick={() => setFullscreenIndex(null)} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center cursor-pointer">✕</button>
          </div>
          <div className="flex-1 flex items-center justify-center px-2 relative">
            {fullscreenIndex > 0 && (
              <button type="button" onClick={() => goToImage(fullscreenIndex - 1)} className="hidden sm:flex absolute left-3 w-10 h-10 rounded-full bg-white/15 text-white items-center justify-center cursor-pointer">‹</button>
            )}
            <img
              src={activeItem.images[fullscreenIndex]}
              alt=""
              className="max-w-full max-h-[calc(100vh-8rem)] object-contain select-none"
              draggable={false}
            />
            {fullscreenIndex < activeItem.images.length - 1 && (
              <button type="button" onClick={() => goToImage(fullscreenIndex + 1)} className="hidden sm:flex absolute right-3 w-10 h-10 rounded-full bg-white/15 text-white items-center justify-center cursor-pointer">›</button>
            )}
          </div>
          <p className="text-center text-[10px] tracking-widest uppercase text-white/50 pb-6">Swipe to browse</p>
        </div>
      )}
    </div>
  );
};
