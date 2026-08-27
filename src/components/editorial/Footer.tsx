import { siteContent } from '../../data/site';

export const Footer = () => {
  const { business, hours } = siteContent;

  return (
    <footer className="bg-[#111111] text-[#FAF9F6] border-t border-[#C5A880]/30 pt-16 pb-8 px-6 md:px-12 lg:px-16 font-sans">
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 pb-16 border-b border-white/5">
        {/* Column 1: Brand Info */}
        <div className="space-y-6">
          <h2 className="font-serif text-3xl tracking-[0.2em] text-[#FAF9F6] uppercase">
            MAHEK
          </h2>
          <p className="text-sm font-light text-[#8C8C8C] leading-relaxed max-w-xs">
            Refined dressing, defined by detail. Discover custom tailoring, premium fabrics, and handcrafted traditional occasion wear.
          </p>
          <div className="pt-2 flex items-center gap-4">
            <a
              href={business.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8C8C8C] hover:text-[#C5A880] transition-colors duration-300"
              aria-label="Follow MAHEK on Instagram"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
            </a>
            <a
              href={business.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8C8C8C] hover:text-[#C5A880] transition-colors duration-300"
              aria-label="Follow MAHEK on Facebook"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Collections Shortcuts */}
        <div className="space-y-6">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880]">
            The Collections
          </h3>
          <ul className="space-y-3 text-sm font-light text-[#8C8C8C]">
            <li><a href="/collections/sherwanis" className="hover:text-[#C5A880] transition-colors duration-300">Sherwanis</a></li>
            <li><a href="/collections/suits" className="hover:text-[#C5A880] transition-colors duration-300">Suits & Blazers</a></li>
            <li><a href="/collections/bandgalas" className="hover:text-[#C5A880] transition-colors duration-300">Bandgalas</a></li>
            <li><a href="/collections/jodhpuris" className="hover:text-[#C5A880] transition-colors duration-300">Jodhpuris</a></li>
            <li><a href="/collections/kurta-pajamas" className="hover:text-[#C5A880] transition-colors duration-300">Kurta Pajamas</a></li>
            <li><a href="/collections/nehru-jackets" className="hover:text-[#C5A880] transition-colors duration-300">Nehru Jackets</a></li>
            <li><a href="/collections" className="hover:text-[#C5A880] transition-colors duration-300 font-medium text-[#C5A880]/80">View All Collections →</a></li>
          </ul>
        </div>

        {/* Column 3: Store Details */}
        <div className="space-y-6">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A880]">
            Tolichowki Store
          </h3>
          <p className="text-sm font-light text-[#8C8C8C] leading-relaxed">
            A/1, 9-4-87/1, Beside Mughal Residency,<br />
            MD Lines, Toli Chowki,<br />
            Hyderabad, Telangana 500008
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
          <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A880] transition-colors duration-300">Official Website</a>
        </div>
      </div>
    </footer>
  );
};
