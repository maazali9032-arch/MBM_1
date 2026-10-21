import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { siteContent } from '../../data/site';

// Search function calling Supabase RPC or falling back to ILIKE queries
const searchProducts = async ({ query, pageParam = 0 }: { query: string; pageParam?: number }) => {
  if (!query || query.length < 2) return [];

  // Step 1: Search and fetch IDs
  let productIds: string[] = [];
  
  try {
    const { data, error } = await supabase.rpc('search_products', { p_query: query });
    if (error) throw error;
    productIds = data || [];
  } catch (rpcError) {
    // Fallback: ILIKE query on products and categories
    const { data, error } = await supabase
      .from('products')
      .select('id, product_code, name, description, categories(name)')
      .eq('is_active', true);
      
    if (error) throw error;
    
    const lowerQuery = query.toLowerCase();
    const matched = data.filter((p: any) => {
      const codeMatch = p.product_code.toLowerCase().includes(lowerQuery);
      const nameMatch = p.name && p.name.toLowerCase().includes(lowerQuery);
      const descMatch = p.description && p.description.toLowerCase().includes(lowerQuery);
      const catMatch = p.categories && p.categories.name.toLowerCase().includes(lowerQuery);
      return codeMatch || nameMatch || descMatch || catMatch;
    });
    
    productIds = matched.map((m: any) => m.id);
  }

  if (productIds.length === 0) return [];

  // Step 2: Paginate product IDs
  const limit = 24;
  const startIdx = pageParam * limit;
  const paginatedIds = productIds.slice(startIdx, startIdx + limit);

  if (paginatedIds.length === 0) return [];

  // Step 3: Hydrate products with categories and primary images (display_order = 0)
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*), product_images(public_url)')
    .in('id', paginatedIds)
    .eq('product_images.display_order', 0);

  if (error) throw error;

  // Re-sort results to match search order of IDs
  return paginatedIds.map((id) => data.find((p: any) => p.id === id)).filter(Boolean);
};

export const SearchCatalogue = () => {
  const [searchVal, setSearchVal] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce query inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal.trim().length >= 2) {
        setDebouncedQuery(searchVal.trim());
      } else {
        setDebouncedQuery('');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchVal]);

  // Infinite query for search
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['search', 'infinite', debouncedQuery],
    queryFn: ({ pageParam = 0 }) => searchProducts({ query: debouncedQuery, pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 24 ? allPages.length : undefined;
    },
    enabled: debouncedQuery.length >= 2
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
  const handleWhatsAppInquiry = (product: any) => {
    const catName = product.categories?.name || 'Collection';
    const displayName = product.name || `${catName} ${product.product_code}`;
    const number = siteContent.business.phone.replace(/[^0-9]/g, '');
    const message = `Hi, I am interested in inquiring about the custom ${displayName} (Code: ${product.product_code}) under the ${catName} collection.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const resultsList = data?.pages.flat() || [];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans pb-24">
      {/* Subpage Sticky Header */}
      <header className="sticky top-0 bg-[#111111] z-40 border-b border-[#C5A880]/30 py-6 px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="text-xs tracking-[0.2em] uppercase text-[#FAF9F6]/80 hover:text-[#C5A880] transition-colors duration-300">
          ← SHOWROOM
        </Link>
        <a href="/" className="inline-flex items-center" aria-label="Maqdoom's Big Mall home">
          <img src="/LOGO.png" alt="Maqdoom's Big Mall" className="h-8 md:h-10 w-auto object-contain" decoding="async" />
        </a>
        <div className="w-20 hidden md:block"></div>
      </header>

      {/* Search Input Bar */}
      <section className="py-12 max-w-3xl mx-auto px-6 text-center space-y-6">
        <h2 className="font-serif text-2xl md:text-3xl uppercase tracking-wider">Search Catalogue</h2>
        <div className="relative max-w-md mx-auto">
          <input
            type="search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search by code (e.g. SHW), product name..."
            className="w-full px-5 py-3 bg-white border border-neutral-300 rounded-sm focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] font-light text-sm tracking-wide shadow-sm"
          />
        </div>
        {searchVal && searchVal.length < 2 && (
          <p className="text-[10px] text-red-500 uppercase tracking-widest">
            Please enter at least 2 characters to search
          </p>
        )}
      </section>

      {/* Results Section */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 lg:px-16">
        {isLoading ? (
          <div className="text-center py-20 text-xs tracking-widest text-[#8C8C8C]">
            SEARCHING CATALOGUE...
          </div>
        ) : debouncedQuery && resultsList.length === 0 ? (
          <div className="text-center py-20 text-sm text-[#8C8C8C] font-light">
            No products match your search query. Try another term.
          </div>
        ) : !debouncedQuery ? (
          <div className="text-center py-20 text-xs tracking-[0.15em] text-[#8C8C8C] uppercase font-light">
            Enter a search term above to browse design registry
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {resultsList.map((product: any) => {
              if (!product) return null;
              const catName = product.categories?.name || 'Collection';
              const primaryImage = product.product_images?.[0]?.public_url || '/images/SHW1.webp';
              const displayName = product.name || `${catName} ${product.product_code}`;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col justify-between border border-[#C5A880]/10 bg-white p-4 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] hover:border-[#C5A880]/20 transition-all duration-300"
                >
                  <div className="space-y-4">
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

                    <div className="px-1 space-y-1">
                      <div className="flex justify-between items-center text-[10px] tracking-widest text-[#8C8C8C]">
                        <span>{product.product_code}</span>
                        <span className="uppercase text-[#C5A880]">{catName}</span>
                      </div>
                      
                      <Link href={`/products/${product.product_code}`}>
                        <h3 className="font-serif text-base text-[#1A1A1A] hover:text-[#C5A880] cursor-pointer transition-colors duration-200">
                          {displayName}
                        </h3>
                      </Link>
                      
                      {product.description && (
                        <p className="text-xs text-[#8C8C8C] line-clamp-1 font-light">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-neutral-100 flex gap-2">
                    <Link href={`/products/${product.product_code}`} className="flex-1 text-center py-2 border border-neutral-200 text-[10px] tracking-widest uppercase hover:bg-neutral-800 hover:text-white transition-colors duration-300 rounded-sm">
                      Details
                    </Link>
                    <button
                      onClick={() => handleWhatsAppInquiry(product)}
                      className="flex-1 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[10px] tracking-widest uppercase font-semibold transition-colors duration-300 rounded-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.62.962 3.21 1.453 4.857 1.458 5.425.002 9.837-4.407 9.84-9.84.002-2.633-1.02-5.107-2.88-6.97C16.604 1.94 14.136.916 11.51.916c-5.434 0-9.848 4.417-9.85 9.851 0 1.77.479 3.491 1.39 5.04l-.995 3.635 3.737-.98c1.514.827 3.033 1.272 4.262 1.272zm11.238-7.79c-.3-.15-1.772-.875-2.046-.975-.276-.1-.476-.15-.676.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-1.04-.52-1.786-.96-2.502-2.18-.19-.32-.075-.47.05-.595.112-.113.25-.29.375-.435.125-.145.166-.245.25-.41.083-.165.04-.31-.02-.46-.06-.15-.476-1.147-.65-1.572-.17-.41-.35-.35-.475-.356-.12-.006-.26-.008-.4-.008-.14 0-.36.05-.55.26-.19.21-.724.708-.724 1.728 0 1.02.742 2.004.845 2.14.104.14 1.46 2.228 3.54 3.12 1.685.72 2.03.58 2.405.546.375-.035 1.77-.72 2.02-1.415.25-.695.25-1.29.175-1.415-.075-.125-.275-.2-.575-.35z" />
                      </svg>
                      Enquire
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sentinel for infinite scroll query */}
        <div ref={sentinelRef} className="h-20 w-full flex items-center justify-center mt-12">
          {isFetchingNextPage && (
            <span className="text-xs tracking-widest text-[#8C8C8C] animate-pulse">
              LOADING MORE RESULTS...
            </span>
          )}
        </div>
      </section>

    </div>
  );
};
export default SearchCatalogue;
