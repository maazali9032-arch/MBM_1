import { siteContent } from '../../data/site';
import { allCollectionsPath, collectionFilterPath } from '../../lib/collectionRoutes';

export const Footer = () => {
  const { business, hours } = siteContent;

  return (
    <footer className="bg-[#111111] text-[#FAF9F6] border-t border-[#C5A880]/30 pt-16 pb-8 px-6 md:px-12 lg:px-16 font-sans">
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 pb-16 border-b border-white/5">
        {/* Column 1: Brand Info */}
        <div className="space-y-6">
          <a href="/" className="inline-flex items-center" aria-label="Maqdoom's Big Mall home">
            <img
              src="/Logo.png"
              alt="Maqdoom's Big Mall"
              className="h-10 md:h-12 w-auto object-contain"
              decoding="async"
            />
          </a>
          <p className="text-sm font-light text-[#8C8C8C] leading-relaxed max-w-xs">
            Refined dressing, defined by detail. Discover custom tailoring, premium fabrics, and handcrafted traditional occasion wear.
          </p>
        </div>

        {/* Column 2: Collections Shortcuts */}
        <div className="space-y-6">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880]">
            The Collections
          </h3>
          <ul className="space-y-3 text-sm font-light text-[#8C8C8C]">
            <li><a href={collectionFilterPath('sherwani')} className="hover:text-[#C5A880] transition-colors duration-300">Sherwanis</a></li>
            <li><a href={collectionFilterPath('suit')} className="hover:text-[#C5A880] transition-colors duration-300">Suits & Blazers</a></li>
            <li><a href={collectionFilterPath('bandgala')} className="hover:text-[#C5A880] transition-colors duration-300">Bandgalas</a></li>
            <li><a href={collectionFilterPath('jodhpuri')} className="hover:text-[#C5A880] transition-colors duration-300">Jodhpuri</a></li>
            <li><a href={collectionFilterPath('kurta')} className="hover:text-[#C5A880] transition-colors duration-300">Kurta Pajamas</a></li>
            <li><a href={collectionFilterPath('nehru')} className="hover:text-[#C5A880] transition-colors duration-300">Nehru Jackets</a></li>
            <li><a href={allCollectionsPath} className="hover:text-[#C5A880] transition-colors duration-300 font-medium text-[#C5A880]/80">View All Collections →</a></li>
          </ul>
        </div>

        {/* Column 3: Store Details */}
        <div className="space-y-6">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880]">
            Pathergatti Store
          </h3>
          <p className="text-sm font-light text-[#8C8C8C] leading-relaxed">
            22-7-177, Maqdoom Building, Pathergatti,<br />
            Charminar Road, Hyderabad,<br />
            Telangana 500002
          </p>
          <div className="text-sm font-light text-[#8C8C8C] space-y-1">
            <p>
              Phone:{' '}
              <a href={`tel:${business.phone}`} className="text-[#C5A880] hover:underline">
                {business.phone}
              </a>
            </p>
            <p>
              Map Link:{' '}
              <a href={business.googleMaps} target="_blank" rel="noopener noreferrer" className="text-[#C5A880] hover:underline">
                View on Google Maps
              </a>
            </p>
          </div>
        </div>

        {/* Column 4: Hours */}
        <div className="space-y-6">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880]">
            Store Hours
          </h3>
          <div className="text-sm font-light text-[#8C8C8C] space-y-3">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span>Mon – Sat:</span>
              <span className="text-[#FAF9F6]">{hours.monday}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span>Sunday:</span>
              <span className="text-[#FAF9F6]">{hours.sunday}</span>
            </div>
            <p className="text-xs text-[#8C8C8C] italic pt-1">
              *Hours may differ during public holidays and festive seasons.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Row */}
      <div className="max-w-screen-2xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#8C8C8C] space-y-4 md:space-y-0">
        <p className="font-light">
          {siteContent.footer.copyright}
        </p>
        <div className="flex gap-8">
          <a href="/admin/login" className="hover:text-[#C5A880] transition-colors duration-300">Staff Login</a>
          <a href="#" className="hover:text-[#C5A880] transition-colors duration-300">Privacy Policy</a>
          <a href="#" className="hover:text-[#C5A880] transition-colors duration-300">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};
