import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file (see .env.example).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Public R2 CDN base URL — images are served from here after upload */
export const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL?.trim() || '';

/** Cloudflare upload worker URL — required for admin image uploads */
export const UPLOAD_WORKER_URL = import.meta.env.VITE_UPLOAD_WORKER_URL?.trim() || '';
