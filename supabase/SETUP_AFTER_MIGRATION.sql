-- ============================================================
-- MAHEK Supabase setup — run in Supabase SQL Editor IN ORDER
-- ============================================================

-- STEP 1: Run the full migration file first:
--   supabase/migrations/20260826_catalogue.sql
--
-- If it failed partway (tables exist but policies failed), you can
-- re-run ONLY section 4 (RLS policies) from that file — it now uses
-- DROP POLICY IF EXISTS so it is safe to re-run.

-- STEP 2: Grant RPC permissions
GRANT EXECUTE ON FUNCTION public.admin_create_category(TEXT, TEXT, TEXT, TEXT, JSONB, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_product_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_products(TEXT) TO anon, authenticated;

-- STEP 3: Create your admin auth user in Dashboard → Authentication → Users
-- Then run (replace UUID + email):

-- INSERT INTO public.admin_users (user_id, email)
-- VALUES ('YOUR-AUTH-USER-UUID-HERE', 'admin@mahek.com');

-- STEP 4: Seed categories (optional — or create via /admin/categories after login)
-- Slugs must match the website: sherwanis, suits, bandgalas, jodhpuris,
-- kurta-pajamas, nehru-jackets, formals, pathanis

-- INSERT INTO public.categories (name, slug, description, code_prefix, image_crop_settings, display_order, is_active)
-- VALUES
--   ('Sherwani', 'sherwanis', 'Royal wedding sherwanis', 'SHW', '{"aspectRatio":0.67,"width":800,"height":1200}', 1, true),
--   ('Suit', 'suits', 'Italian bespoke suits', 'SUT', '{"aspectRatio":0.67,"width":800,"height":1200}', 2, true),
--   ('Bandgala', 'bandgalas', 'Imperial court suits', 'BND', '{"aspectRatio":0.67,"width":800,"height":1200}', 3, true),
--   ('Jodhpuri', 'jodhpuris', 'Elite occasion garments', 'JDP', '{"aspectRatio":0.67,"width":800,"height":1200}', 4, true),
--   ('Kurta Pajama', 'kurta-pajamas', 'Festive linen kurtas', 'KPA', '{"aspectRatio":0.67,"width":800,"height":1200}', 5, true),
--   ('Nehru Jacket', 'nehru-jackets', 'Layered waistcoats', 'NHJ', '{"aspectRatio":0.67,"width":800,"height":1200}', 6, true),
--   ('Formal Outfit', 'formals', 'Executive blazers', 'FRM', '{"aspectRatio":0.67,"width":800,"height":1200}', 7, true),
--   ('Pathani', 'pathanis', 'Traditional kurtas', 'PTH', '{"aspectRatio":0.67,"width":800,"height":1200}', 8, true);

-- After seeding categories, init sequence rows:
-- INSERT INTO public.category_code_sequences (category_id, current_value)
-- SELECT id, 0 FROM public.categories
-- ON CONFLICT (category_id) DO NOTHING;
