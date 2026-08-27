import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { supabase } from '../../lib/supabase';
import { deleteMultipleFromR2 } from '../../lib/upload';
import { AdminLayout } from './AdminLayout';

// Fetch products with category join and primary image metadata
const fetchProductsAdmin = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*), product_images(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const AdminProducts = () => {
  const queryClient = useQueryClient();

  // Fetch products query
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin_products'],
    queryFn: fetchProductsAdmin
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: images } = await supabase
        .from('product_images')
        .select('storage_key')
        .eq('product_id', id);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (images?.length) {
        await deleteMultipleFromR2(images.map((img: { storage_key: string }) => img.storage_key));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      alert(`Error deleting product: ${err.message}`);
    }
  });

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to permanently delete product "${code}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AdminLayout activeTab="products">
      <div className="space-y-8 font-sans">
        
        {/* Title and trigger header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-serif text-2xl tracking-wide uppercase">Catalogue Products</h2>
            <p className="text-xs text-[#8C8C8C] mt-1 font-light">Create bespoke garments and upload cropped catalog photos</p>
          </div>
          <Link
            href="/admin/products/new"
            className="px-6 py-2.5 bg-[#C5A880] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
          >
            CREATE PRODUCT
          </Link>
        </div>

        {/* Products List Table */}
        <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="text-center py-20 text-xs tracking-widest text-[#8C8C8C]">
              LOADING DESIGNS...
            </div>
          ) : products?.length === 0 ? (
            <div className="text-center py-20 text-sm text-[#8C8C8C] font-light">
              No products found in the database. Add a product to populate the showroom catalogue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-light text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] font-semibold uppercase tracking-widest border-b border-neutral-200 text-[#8C8C8C]">
                    <th className="px-6 py-4">Thumbnail</th>
                    <th className="px-6 py-4">Product Code</th>
                    <th className="px-6 py-4">Display Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Images Count</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {products?.map((prod: any) => {
                    const primaryImg = prod.product_images?.find((img: any) => img.display_order === 0) || prod.product_images?.[0];
                    const categoryName = prod.categories?.name || 'Category';
                    const displayName = prod.name || `${categoryName} ${prod.product_code}`;
                    const imgCount = prod.product_images?.length || 0;

                    return (
                      <tr key={prod.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-10 h-14 bg-neutral-100 rounded-sm overflow-hidden border border-neutral-200">
                            {primaryImg ? (
                              <img
                                src={primaryImg.public_url}
                                alt="Product thumbnail"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400">
                                NO IMG
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#1A1A1A] tracking-wider font-mono">{prod.product_code}</td>
                        <td className="px-6 py-4 font-medium text-neutral-800">{displayName}</td>
                        <td className="px-6 py-4 text-neutral-500">{categoryName}</td>
                        <td className="px-6 py-4 text-neutral-500 font-mono">{imgCount} / 4</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] tracking-wider font-semibold uppercase ${
                            prod.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {prod.is_active ? 'Active' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-4">
                          <Link
                            href={`/admin/products/edit/${prod.product_code}`}
                            className="text-xs tracking-wider text-[#C5A880] hover:underline cursor-pointer"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(prod.id, prod.product_code)}
                            className="text-xs tracking-wider text-red-500 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
export default AdminProducts;
