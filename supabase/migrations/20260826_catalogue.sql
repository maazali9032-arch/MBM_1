-- Supabase migration file for Product Catalogue System
-- To be run in the Supabase SQL editor.

-- 1. Tables

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    code_prefix TEXT NOT NULL UNIQUE,
    image_crop_settings JSONB NOT NULL DEFAULT '{"aspectRatio": 0.67, "width": 800, "height": 1200, "cropPosition": "center"}',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    product_code TEXT NOT NULL UNIQUE,
    name TEXT,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for product code queries
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(product_code);

-- Product Images table
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    public_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0, -- 0 is the primary thumbnail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for product images display sorting
CREATE INDEX IF NOT EXISTS idx_product_images_product_id_order ON public.product_images(product_id, display_order);

-- Category Code Sequences table
CREATE TABLE IF NOT EXISTS public.category_code_sequences (
    category_id UUID PRIMARY KEY REFERENCES public.categories(id) ON DELETE CASCADE,
    current_value INTEGER NOT NULL DEFAULT 0
);

-- Admin Users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY, -- Links to auth.users.id
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Constraints and Triggers

-- Trigger to enforce maximum of 4 images per product
CREATE OR REPLACE FUNCTION check_product_image_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT count(*) FROM public.product_images WHERE product_id = NEW.product_id) >= 4 THEN
        RAISE EXCEPTION 'A product cannot have more than 4 images';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_limit_product_images
BEFORE INSERT ON public.product_images
FOR EACH ROW EXECUTE FUNCTION check_product_image_limit();


-- 3. Stored Procedures / RPCs

-- Admin transaction to create a category and setup sequence counter
CREATE OR REPLACE FUNCTION public.admin_create_category(
    p_name TEXT,
    p_slug TEXT,
    p_desc TEXT,
    p_prefix TEXT,
    p_crop_settings JSONB,
    p_display_order INTEGER,
    p_is_active BOOLEAN
)
RETURNS public.categories AS $$
DECLARE
    v_category public.categories;
BEGIN
    INSERT INTO public.categories (name, slug, description, code_prefix, image_crop_settings, display_order, is_active)
    VALUES (p_name, p_slug, p_desc, p_prefix, p_crop_settings, p_display_order, p_is_active)
    RETURNING * INTO v_category;

    INSERT INTO public.category_code_sequences (category_id, current_value)
    VALUES (v_category.id, 0);

    RETURN v_category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic product code generation
CREATE OR REPLACE FUNCTION public.generate_product_code(p_category_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_next_val INTEGER;
BEGIN
    -- Lock sequence row for this category
    SELECT code_prefix INTO v_prefix FROM public.categories WHERE id = p_category_id;
    
    INSERT INTO public.category_code_sequences (category_id, current_value)
    VALUES (p_category_id, 1)
    ON CONFLICT (category_id) DO UPDATE 
    SET current_value = public.category_code_sequences.current_value + 1
    RETURNING current_value INTO v_next_val;

    -- Return formatted code, e.g. SHW-003
    RETURN v_prefix || '-' || lpad(v_next_val::text, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public search RPC
CREATE OR REPLACE FUNCTION public.search_products(p_query TEXT)
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT p.id 
    FROM public.products p
    JOIN public.categories c ON p.category_id = c.id
    WHERE p.is_active = true 
      AND c.is_active = true
      AND (
        p.product_code ILIKE '%' || p_query || '%'
        OR p.name ILIKE '%' || p_query || '%'
        OR c.name ILIKE '%' || p_query || '%'
        OR p.description ILIKE '%' || p_query || '%'
      )
    ORDER BY p.display_order ASC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Row Level Security (RLS) Policies

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Categories policies
DROP POLICY IF EXISTS "Public read for active categories" ON public.categories;
CREATE POLICY "Public read for active categories" ON public.categories
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin CRUD on categories" ON public.categories;
CREATE POLICY "Admin CRUD on categories" ON public.categories
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Products policies
DROP POLICY IF EXISTS "Public read for active products" ON public.products;
CREATE POLICY "Public read for active products" ON public.products
    FOR SELECT USING (is_active = true AND EXISTS (
        SELECT 1 FROM public.categories WHERE id = products.category_id AND is_active = true
    ));

DROP POLICY IF EXISTS "Admin CRUD on products" ON public.products;
CREATE POLICY "Admin CRUD on products" ON public.products
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Product images policies
DROP POLICY IF EXISTS "Public read for active product images" ON public.product_images;
CREATE POLICY "Public read for active product images" ON public.product_images
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.categories c ON p.category_id = c.id
        WHERE p.id = product_images.product_id AND p.is_active = true AND c.is_active = true
    ));

DROP POLICY IF EXISTS "Admin CRUD on product_images" ON public.product_images;
CREATE POLICY "Admin CRUD on product_images" ON public.product_images
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Admin users policy
DROP POLICY IF EXISTS "Allow admin read" ON public.admin_users;
CREATE POLICY "Allow admin read" ON public.admin_users
    FOR SELECT USING (true);
