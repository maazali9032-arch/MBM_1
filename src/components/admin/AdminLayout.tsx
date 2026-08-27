import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { supabase } from '../../lib/supabase';

export const AdminLayout = ({ children, activeTab }: { children: React.ReactNode; activeTab: 'products' | 'categories' }) => {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Authenticate session and check admin allowlist
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (!activeSession) {
          setLocation('/admin/login');
          return;
        }
        setSession(activeSession);
      } catch (err) {
        setLocation('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [setLocation]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-sans text-xs tracking-widest text-[#8C8C8C]">
        VERIFYING ADMINISTRATOR SESSION...
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans flex flex-col justify-between">
      {/* Admin Nav Bar */}
      <div>
        <header className="bg-[#1A1A1A] text-[#FAF9F6] border-b border-[#C5A880]/30 py-4 px-4 sm:px-6 md:px-12 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-serif text-base sm:text-lg tracking-[0.15em] sm:tracking-[0.2em] uppercase truncate">MAHEK PANEL</h1>
            <span className="shrink-0 text-[9px] sm:text-[10px] bg-[#C5A880] text-[#1A1A1A] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <Link href="/" className="text-xs tracking-widest text-[#8C8C8C] hover:text-[#FAF9F6] transition-colors whitespace-nowrap">
              VIEW SITE
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs tracking-widest text-red-400 hover:text-red-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              LOGOUT
            </button>
          </div>
        </header>

        {/* Tab switch bar */}
        <div className="border-b border-neutral-200 bg-white py-3 shadow-sm overflow-x-auto">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-12 flex gap-6 sm:gap-8 min-w-max sm:min-w-0">
            <Link
              href="/admin/products"
              className={`text-xs tracking-[0.15em] uppercase pb-1 transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'text-[#C5A880] font-semibold border-b-2 border-[#C5A880]'
                  : 'text-[#8C8C8C] hover:text-[#1A1A1A]'
              }`}
            >
              Manage Products
            </Link>
            <Link
              href="/admin/categories"
              className={`text-xs tracking-[0.15em] uppercase pb-1 transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'text-[#C5A880] font-semibold border-b-2 border-[#C5A880]'
                  : 'text-[#8C8C8C] hover:text-[#1A1A1A]'
              }`}
            >
              Manage Categories
            </Link>
          </div>
        </div>

        {/* Children panel content */}
        <main className="max-w-screen-2xl mx-auto px-6 md:px-12 py-10">
          {children}
        </main>
      </div>

      {/* Admin Panel Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-800 py-6 text-center text-xs text-neutral-500 font-light mt-auto">
        &copy; MAHEK Admin Management Portal. Secured via Supabase Auth & RLS.
      </footer>
    </div>
  );
};
export default AdminLayout;
