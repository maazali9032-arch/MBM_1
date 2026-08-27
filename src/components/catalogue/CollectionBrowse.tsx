import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { siteContent } from '../../data/site';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import { fetchCatalogueProducts, PRODUCTS_PAGE_SIZE } from '../../lib/catalogueQueries';

// Fetch all active categories
const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data;
};

// Fetch products for a category with infinite scroll (newest first)
const fetchCategoryProducts = async ({ categoryId, pageParam = 0 }: { categoryId: string; pageParam?: number }) =>
  fetchCatalogueProducts({ pageParam, categoryId, search: '' });

export const CollectionBrowse = ({ params }: { params: { slug: string } }) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 1. Fetch categories for switcher
  const { data: categories, isLoading: loadingCats, error: catError } = useQuery({
    queryKey: ['categories', true],
    queryFn: fetchCategories
  });

  // Find current active category by slug
  const activeCategory = categories?.find((c: any) => c.slug === params.slug);

  // 2. Fetch products using Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingProds,
    isError
  } = useInfiniteQuery({
    queryKey: ['products', 'infinite', activeCategory?.id],
    queryFn: ({ pageParam = 0 }) => fetchCategoryProducts({ categoryId: activeCategory?.id, pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PRODUCTS_PAGE_SIZE ? allPages.length : undefined,
    enabled: !!activeCategory?.id
  });

  // Intersection Observer for scroll loading
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { threshold: 0.1 });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sentinelRef.current, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle WhatsApp inquiry
  const handleWhatsAppInquiry = (product: { product_code: string; name?: string | null }, categoryName: string) => {
    const title = product.name || `${categoryName} ${product.product_code}`;
    const number = siteContent.business.phone.replace(/[^0-9]/g, '');
    const message = `Hi, I'm interested in inquiring about a design at MAHEK.\n\nProduct: ${title}\nCode: ${product.product_code}\nCategory: ${categoryName}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loadingCats) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-sans text-sm tracking-widest text-[#8C8C8C]">
        LOADING COLLECTIONS...
      </div>
    );
  }

  // Not Found State
  if (!activeCategory && !loadingCats) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="font-serif text-3xl mb-4">Collection Not Found</h2>
        <p className="text-sm text-[#8C8C8C] mb-6">The collection you are trying to browse is unavailable.</p>
        <Link href="/" className="px-6 py-2 border border-[#C5A880] text-xs uppercase tracking-widest hover:bg-[#C5A880] hover:text-[#FAF9F6] transition-colors">
          Return to Showroom
        </Link>
      </div>
    );
  }

  // Catalogue Unavailable State
  if (catError || isError) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="font-serif text-3xl mb-4">Catalogue Offline</h2>
        <p className="text-sm text-[#8C8C8C] mb-6">Our product catalogue is currently offline. Please try again later or contact us directly.</p>
        <div className="space-x-4">
          <a href={`tel:${siteContent.business.phone}`} className="px-6 py-2 border border-[#C5A880] text-xs uppercase tracking-widest hover:bg-[#C5A880] hover:text-[#FAF9F6] transition-colors">
            Call Store
          </a>
          <Link href="/" className="px-6 py-2 border border-neutral-300 text-xs uppercase tracking-widest hover:bg-neutral-800 hover:text-white transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const productsList = data?.pages.flat() || [];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans pb-24">
      {/* Subpage Sticky Header */}
      <header className="sticky top-0 bg-[#111111] z-40 border-b border-[#C5A880]/30 py-6 px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="text-xs tracking-[0.2em] uppercase text-[#FAF9F6]/80 hover:text-[#C5A880] transition-colors duration-300">
          ← SHOWROOM
        </Link>
        <Link href="/" className="inline-flex items-center" aria-label="MAHEK home">
          <img src="/Logo.png" alt="MAHEK" className="h-8 md:h-10 w-auto object-contain" decoding="async" />
        </Link>
        <Link href="/search" className="text-xs tracking-[0.2em] uppercase text-[#FAF9F6]/80 hover:text-[#C5A880] transition-colors duration-300">
          SEARCH
        </Link>
      </header>

      {/* Category switcher */}
      <div className="w-full border-b border-neutral-200/50 bg-white/50 backdrop-blur-sm sticky top-[73px] z-30 py-4 overflow-x-auto">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 flex gap-8 whitespace-nowrap scrollbar-none">
          {categories?.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className={`text-xs tracking-[0.2em] uppercase transition-colors duration-300 cursor-pointer ${
                cat.slug === params.slug
                  ? 'text-[#C5A880] font-medium border-b border-[#C5A880] pb-1'
                  : 'text-[#8C8C8C] hover:text-[#1A1A1A]'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Category Title & Banner */}
      <section className="py-16 text-center max-w-3xl mx-auto px-6">
        <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] mb-2 block">Bespoke Registry</span>
        <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] uppercase tracking-wide">
          {activeCategory?.name}
        </h2>
        {activeCategory?.description && (
          <p className="text-sm font-light text-[#8C8C8C] leading-relaxed mt-4">
            {activeCategory.description}
          </p>
        )}
      </section>

      {/* Products Grid */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 lg:px-16">
        {loadingProds ? (
          <div className="text-center py-20 text-xs tracking-widest text-[#8C8C8C]">
            LOADING PRODUCTS...
          </div>
        ) : productsList.length === 0 ? (
          <div className="text-center py-20 text-sm text-[#8C8C8C] font-light">
            No active products in this collection yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {productsList.map((product: any) => {
              // Retrieve public URL from joined product_images array (if available)
              const primaryImage = product.product_images?.[0]?.public_url || '/images/SHW1.webp';
              const displayName = product.name || `${activeCategory?.name} ${product.product_code}`;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col justify-between border border-[#C5A880]/10 bg-white p-2.5 sm:p-3 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] hover:border-[#C5A880]/20 transition-all duration-300"
                >
                  <div className="space-y-2 sm:space-y-3">
                    {/* Link wrapping image */}
                    <Link href={`/products/${product.product_code}`}>
                      <div className="aspect-[3/4] w-full overflow-hidden rounded-sm bg-neutral-100 relative cursor-pointer">
                        <img
                          src={primaryImage}
                          alt={displayName}
                          className="w-full h-full object-cover group-hover:scale-102 transition-all duration-500 ease-out"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                      </div>
                    </Link>

                    <div className="px-0.5 space-y-0.5">
                      <div className="flex justify-between items-center text-[9px] sm:text-[10px] tracking-widest text-[#8C8C8C] gap-1">
                        <span className="truncate">{product.product_code}</span>
                        <span className="shrink-0">BESPOKE</span>
                      </div>
                      
                      <Link href={`/products/${product.product_code}`}>
                        <h3 className="font-serif text-sm sm:text-base text-[#1A1A1A] hover:text-[#C5A880] cursor-pointer transition-colors duration-200 line-clamp-2 leading-snug">
                          {displayName}
                        </h3>
                      </Link>
                      
                      {product.description && (
                        <p className="text-[10px] sm:text-xs text-[#8C8C8C] line-clamp-1 font-light hidden sm:block">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 pt-2 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => handleWhatsAppInquiry(product, activeCategory?.name || 'Category')}
                      className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[10px] sm:text-xs tracking-widest uppercase font-semibold transition-colors duration-300 rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <WhatsAppIcon className="w-4 h-4 shrink-0" />
                      Enquiry
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sentinel element for infinite scroll */}
        <div ref={sentinelRef} className="h-20 w-full flex items-center justify-center mt-12">
          {isFetchingNextPage && (
            <span className="text-xs tracking-widest text-[#8C8C8C] animate-pulse">
              LOADING MORE DESIGNS...
            </span>
          )}
        </div>
      </section>

    </div>
  );
};
export default CollectionBrowse;
