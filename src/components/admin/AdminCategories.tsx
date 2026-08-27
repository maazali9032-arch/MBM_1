import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from './AdminLayout';
import { generateCodePrefix, FIXED_CROP_SETTINGS, nextDisplayOrder } from '../../lib/categoryUtils';

const fetchCategoriesAdmin = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data;
};

export const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [prefix, setPrefix] = useState('');
  const [displayOrderInput, setDisplayOrderInput] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin_categories'],
    queryFn: fetchCategoriesAdmin,
  });

  useEffect(() => {
    if (showAddForm) {
      setDisplayOrderInput('');
    }
  }, [showAddForm]);

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.rpc('admin_create_category', payload);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setName('');
      setSlug('');
      setDescription('');
      setPrefix('');
      setDisplayOrderInput('');
      setIsActive(true);
      setShowAddForm(false);
    },
    onError: (err: Error) => {
      alert(`Error creating category: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { count, error: countErr } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (countErr) throw countErr;
      if (count && count > 0) {
        throw new Error(`Cannot delete category. There are ${count} products linked to it.`);
      }

      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: Error) => {
      alert(err.message || 'Failed to delete category');
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    setPrefix(generateCodePrefix(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !prefix) {
      alert('Please fill out all required fields');
      return;
    }

    const order = displayOrderInput.trim()
      ? parseInt(displayOrderInput, 10)
      : nextDisplayOrder(categories || []);

    createMutation.mutate({
      p_name: name,
      p_slug: slug,
      p_desc: description,
      p_prefix: prefix.toUpperCase().trim(),
      p_crop_settings: FIXED_CROP_SETTINGS,
      p_display_order: order,
      p_is_active: isActive,
    });
  };

  return (
    <AdminLayout activeTab="categories">
      <div className="space-y-8 font-sans">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="font-serif text-2xl tracking-wide uppercase">Product Categories</h2>
            <p className="text-xs text-[#8C8C8C] mt-1 font-light">Manage catalogue tags — images use fixed 800×1200 crop</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-2.5 bg-[#C5A880] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
          >
            {showAddForm ? 'CANCEL' : 'CREATE CATEGORY'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-[#C5A880]/20 rounded-sm p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="font-serif text-lg tracking-wide uppercase text-neutral-800">Add New Category</h3>
            <div className="w-12 h-[1px] bg-[#C5A880] mb-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8C8C8C]">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Bandgala"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-sm text-sm focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8C8C8C]">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. bandgalas"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-sm text-sm focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8C8C8C]">Code Prefix (auto) *</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. BND"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm text-sm font-mono focus:outline-none focus:border-[#C5A880]"
                />
                <p className="text-[9px] text-[#8C8C8C]">First + middle + last letter of name</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8C8C8C]">Display Order</label>
                <input
                  type="number"
                  min={1}
                  value={displayOrderInput}
                  onChange={(e) => setDisplayOrderInput(e.target.value)}
                  placeholder={`Auto (${categories ? nextDisplayOrder(categories) : 1})`}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-sm text-sm focus:outline-none focus:border-[#C5A880]"
                />
                <p className="text-[9px] text-[#8C8C8C]">Leave blank for auto-increment</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8C8C8C]">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Category description..."
                className="w-full h-20 px-3 py-2 bg-white border border-neutral-300 rounded-sm text-sm focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <p className="text-[10px] text-[#8C8C8C] uppercase tracking-wider bg-neutral-50 border border-neutral-100 rounded-sm px-3 py-2">
              Image crop: fixed at 800 × 1200 px (2:3 portrait) for all products in this category
            </p>

            <div className="border-t border-neutral-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-[#C5A880]" />
                <span className="text-xs uppercase tracking-widest text-[#1A1A1A]">Is Category Active</span>
              </label>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full md:w-auto px-10 py-3 bg-[#1A1A1A] hover:bg-[#C5A880] text-[#FAF9F6] text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-colors cursor-pointer"
              >
                {createMutation.isPending ? 'CREATING...' : 'SAVE CATEGORY'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="text-center py-20 text-xs tracking-widest text-[#8C8C8C]">LOADING CATEGORIES...</div>
          ) : categories?.length === 0 ? (
            <div className="text-center py-20 text-sm text-[#8C8C8C] font-light">No categories found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-light text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] font-semibold uppercase tracking-widest border-b border-neutral-200 text-[#8C8C8C]">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Prefix</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {categories?.map((cat: { id: string; name: string; slug: string; code_prefix: string; display_order: number; is_active: boolean }) => (
                    <tr key={cat.id} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-4 font-medium">{cat.name}</td>
                      <td className="px-6 py-4 text-neutral-500 font-mono text-xs">{cat.slug}</td>
                      <td className="px-6 py-4 text-[#C5A880] font-semibold font-mono">{cat.code_prefix}</td>
                      <td className="px-6 py-4 text-neutral-500">{cat.display_order}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase ${cat.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {cat.is_active ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" onClick={() => { if (window.confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat.id); }} className="text-xs text-red-500 hover:underline cursor-pointer">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
export default AdminCategories;
