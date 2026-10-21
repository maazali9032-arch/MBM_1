import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { supabase } from '../../lib/supabase';

export const AdminLogin = () => {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;

      if (data?.session) {
        const { data: adminCheck, error: adminErr } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', data.user?.id)
          .single();

        if (adminErr || !adminCheck) {
          await supabase.auth.signOut();
          throw new Error('Access Denied: You are not in the administrator allowlist.');
        }

        setLocation('/admin/products');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-[#C5A880]/20 rounded-sm p-8 md:p-10 shadow-lg space-y-8 relative">
        
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] block">Administrator Access</span>
          <h1 className="font-serif text-3xl tracking-wide uppercase">Maqdoom's Big Mall Admin</h1>
          <div className="w-12 h-[1px] bg-[#C5A880] mx-auto mt-4" />
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3 text-xs uppercase tracking-wider text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#8C8C8C]">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-sm focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] text-sm font-light tracking-wide shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#8C8C8C]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-sm focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] text-sm font-light tracking-wide shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1A1A1A] hover:bg-[#C5A880] text-[#FAF9F6] font-sans text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-colors duration-300 shadow-md cursor-pointer disabled:bg-neutral-400"
          >
            {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
          </button>
        </form>
      </div>

      <Link href="/" className="mt-8 text-xs tracking-widest uppercase text-[#8C8C8C] hover:text-[#C5A880] transition-colors duration-200">
        ← BACK TO SHOWROOM
      </Link>
    </div>
  );
};
export default AdminLogin;
