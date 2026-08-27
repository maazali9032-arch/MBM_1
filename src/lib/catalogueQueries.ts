import { supabase } from './supabase';

export const PRODUCTS_PAGE_SIZE = 20;

export type CatalogueProduct = {
  id: string;
  product_code: string;
  name: string | null;
  description: string | null;
  category_id: string;
  created_at?: string;
  categories?: { name: string; slug: string } | null;
  product_images?: { public_url: string }[];
};

export async function fetchCatalogueProducts({
  pageParam = 0,
  categoryId = null,
  search = '',
}: {
  pageParam?: number;
  categoryId?: string | null;
  search?: string;
}): Promise<CatalogueProduct[]> {
  const from = pageParam * PRODUCTS_PAGE_SIZE;
  const to = from + PRODUCTS_PAGE_SIZE - 1;
  const trimmedSearch = search.trim();

  let query = supabase
    .from('products')
    .select('*, categories(name, slug), product_images(public_url)')
    .eq('is_active', true)
    .eq('product_images.display_order', 0)
    .order('created_at', { ascending: false });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (trimmedSearch.length >= 2) {
    const q = trimmedSearch.replace(/[%_]/g, '');
    query = query.or(`name.ilike.%${q}%,product_code.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await query.range(from, to);
  if (error) throw error;
  return data ?? [];
}

export async function fetchActiveCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
