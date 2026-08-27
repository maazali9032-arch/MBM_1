import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { uploadToR2, deleteFromR2 } from '../../lib/upload';
import { FIXED_CROP_SETTINGS } from '../../lib/categoryUtils';
import { AdminLayout } from './AdminLayout';

interface Category {
  id: string;
  name: string;
  slug: string;
  code_prefix: string;
  image_crop_settings: {
    aspectRatio: number;
    width: number;
    height: number;
  };
}

interface ImageBlobItem {
  id: string;
  blob: Blob;
  previewUrl: string;
  display_order: number;
}

interface ExistingImage {
  id: string;
  public_url: string;
  storage_key: string;
  display_order: number;
  isDeleted?: boolean;
}

export const ProductForm = () => {
  const [, setLocation] = useLocation();
  const params = useParams<{ code?: string }>();
  const queryClient = useQueryClient();
  const isEditMode = !!params.code;

  // Form States
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Image States
  const [pendingImages, setPendingImages] = useState<ImageBlobItem[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);

  // Crop Modal States
  const [cropImgSrc, setCropImgSrc] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories list
  const { data: categories } = useQuery({
    queryKey: ['admin_categories_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Category[];
    }
  });

  const selectedCategory = categories?.find(c => c.id === categoryId);
  const cropSettings = selectedCategory?.image_crop_settings || FIXED_CROP_SETTINGS;

  // Fetch existing product data if editing
  const { data: existingProduct, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin_edit_product', params.code],
    queryFn: async () => {
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('product_code', params.code)
        .single();
      
      if (prodErr) throw prodErr;

      const { data: images, error: imgErr } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });

      if (imgErr) throw imgErr;

      return { ...product, images: images || [] };
    },
    enabled: isEditMode && !!params.code
  });

  // Load existing data into form
  useEffect(() => {
    if (existingProduct) {
      setCategoryId(existingProduct.category_id);
      setName(existingProduct.name || '');
      setDescription(existingProduct.description || '');
      setIsActive(existingProduct.is_active);
      setExistingImages(existingProduct.images || []);
    }
  }, [existingProduct]);

  // Canvas redraw trigger (crop preview)
  useEffect(() => {
    if (!cropImgSrc || !canvasRef.current || !imageRef.current) return;
    drawCanvas();
  }, [cropImgSrc, zoom, panX, panY]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!categoryId) {
      alert('Please select a category first to configure the image cropper.');
      e.target.value = '';
      return;
    }

    const activeCount = existingImages.filter((img) => !img.isDeleted).length + pendingImages.length;
    if (activeCount >= 4) {
      alert('A product can contain a maximum of 4 images.');
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setCropImgSrc(reader.result as string);
        setZoom(1);
        setPanX(0);
        setPanY(0);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate crop box properties
    const boxAspect = cropSettings.aspectRatio;
    let boxWidth = canvas.width * 0.8;
    let boxHeight = boxWidth / boxAspect;

    if (boxHeight > canvas.height * 0.8) {
      boxHeight = canvas.height * 0.8;
      boxWidth = boxHeight * boxAspect;
    }

    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = (canvas.height - boxHeight) / 2;

    // Draw darkened backdrop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop box hole
    ctx.clearRect(boxX, boxY, boxWidth, boxHeight);

    // Set clipping area to draw image ONLY inside crop box
    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.clip();

    // Calculate image dimensions to fit the crop box initially
    const imgAspect = img.width / img.height;
    let drawWidth = boxWidth;
    let drawHeight = drawWidth / imgAspect;

    if (drawHeight < boxHeight) {
      drawHeight = boxHeight;
      drawWidth = drawHeight * imgAspect;
    }

    // Apply zoom and panning
    const zoomedWidth = drawWidth * zoom;
    const zoomedHeight = drawHeight * zoom;
    const drawX = boxX + (boxWidth - zoomedWidth) / 2 + panX;
    const drawY = boxY + (boxHeight - zoomedHeight) / 2 + panY;

    // Draw the image
    ctx.drawImage(img, drawX, drawY, zoomedWidth, zoomedHeight);
    ctx.restore();

    // Draw bounding gold border on crop box
    ctx.strokeStyle = '#C5A880';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  };

  // Handle Dragging / Panning on Canvas (mouse + touch)
  const startPan = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = { x: clientX, y: clientY };
  };

  const movePan = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setPanX((prev) => prev + dx);
    setPanY((prev) => prev + dy);
    dragStart.current = { x: clientX, y: clientY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    startPan(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    movePan(e.clientX, e.clientY);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      startPan(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      movePan(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Perform Image Crop and Export WEBP blob
  const handleCrop = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    // Generate crop box properties
    const boxAspect = cropSettings.aspectRatio;
    let boxWidth = canvas.width * 0.8;
    let boxHeight = boxWidth / boxAspect;

    if (boxHeight > canvas.height * 0.8) {
      boxHeight = canvas.height * 0.8;
      boxWidth = boxHeight * boxAspect;
    }

    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = (canvas.height - boxHeight) / 2;

    // Calculate source coords relative to the image
    const imgAspect = img.width / img.height;
    let drawWidth = boxWidth;
    let drawHeight = drawWidth / imgAspect;

    if (drawHeight < boxHeight) {
      drawHeight = boxHeight;
      drawWidth = drawHeight * imgAspect;
    }

    const zoomedWidth = drawWidth * zoom;
    const zoomedHeight = drawHeight * zoom;
    const drawX = boxX + (boxWidth - zoomedWidth) / 2 + panX;
    const drawY = boxY + (boxHeight - zoomedHeight) / 2 + panY;

    // Map crop box back to original image coordinates
    const scaleX = img.width / zoomedWidth;
    const scaleY = img.height / zoomedHeight;

    const sourceX = (boxX - drawX) * scaleX;
    const sourceY = (boxY - drawY) * scaleY;
    const sourceWidth = boxWidth * scaleX;
    const sourceHeight = boxHeight * scaleY;

    // Create offscreen canvas for rendering final dimensions
    const offscreen = document.createElement('canvas');
    offscreen.width = cropSettings.width;
    offscreen.height = cropSettings.height;
    const offCtx = offscreen.getContext('2d');

    if (!offCtx) return;

    // Draw cropped image
    offCtx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      cropSettings.width,
      cropSettings.height
    );

    // Export as WEBP
    offscreen.toBlob((blob) => {
      if (!blob) return;

      const activeCount = existingImages.filter((img) => !img.isDeleted).length + pendingImages.length;
      if (activeCount >= 4) {
        alert('A product can contain a maximum of 4 images.');
        setCropImgSrc('');
        return;
      }

      const previewUrl = URL.createObjectURL(blob);
      const newItem: ImageBlobItem = {
        id: `pending-${Math.random().toString(36).substr(2, 9)}`,
        blob,
        previewUrl,
        display_order: pendingImages.length + existingImages.filter(img => !img.isDeleted).length
      };

      setPendingImages([...pendingImages, newItem]);
      setCropImgSrc('');
    }, 'image/webp', 0.85);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      alert('Please select a category.');
      return;
    }

    const totalActiveImagesCount = existingImages.filter(img => !img.isDeleted).length + pendingImages.length;

    if (totalActiveImagesCount === 0) {
      alert('A product must contain at least 1 image to be saved.');
      return;
    }

    if (totalActiveImagesCount > 4) {
      alert('A product can contain a maximum of 4 images.');
      return;
    }

    setSaving(true);

    try {
      let productId = existingProduct?.id;
      let pCode = params.code;

      // ----------------------------------------------------
      // STEP A: CREATE OR UPDATE PRODUCT ROW
      // ----------------------------------------------------
      if (!isEditMode) {
        // Fetch atomic product code via sequence generator RPC
        const { data: code, error: codeErr } = await supabase.rpc('generate_product_code', {
          p_category_id: categoryId
        });
        if (codeErr) throw codeErr;
        pCode = code;

        // Insert new product
        const { data: newProd, error: insertErr } = await supabase
          .from('products')
          .insert({
            category_id: categoryId,
            product_code: pCode,
            name: name.trim() || null,
            description: description.trim() || null,
            is_active: isActive
          })
          .select()
          .single();

        if (insertErr) throw insertErr;
        productId = newProd.id;
      } else {
        // Update existing product
        const { error: updateErr } = await supabase
          .from('products')
          .update({
            name: name.trim() || null,
            description: description.trim() || null,
            is_active: isActive
          })
          .eq('product_code', params.code);

        if (updateErr) throw updateErr;
      }

      // ----------------------------------------------------
      // STEP B: DELETE IMAGES MARKED AS DELETED
      // ----------------------------------------------------
      const deletedImages = existingImages.filter(img => img.isDeleted);
      for (const img of deletedImages) {
        await supabase.from('product_images').delete().eq('id', img.id);
        await deleteFromR2(img.storage_key);
      }

      // ----------------------------------------------------
      // STEP C: UPLOAD PENDING BLOBS TO R2
      // ----------------------------------------------------
      const uploadedImagesMeta: { public_url: string; storage_key: string; display_order: number }[] = [];
      const catSlug = selectedCategory?.slug || 'generic';

      for (let i = 0; i < pendingImages.length; i++) {
        const item = pendingImages[i];
        const imageUuid = crypto.randomUUID();
        const storageKey = `products/${catSlug}/${productId}/${imageUuid}.webp`;

        const publicUrl = await uploadToR2(
          item.blob,
          storageKey,
          `${imageUuid}.webp`
        );

        uploadedImagesMeta.push({
          public_url: publicUrl,
          storage_key: storageKey,
          display_order: item.display_order
        });
      }

      // ----------------------------------------------------
      // STEP D: SAVE IMAGE METADATA ROWS IN DATABASE
      // ----------------------------------------------------
      if (uploadedImagesMeta.length > 0) {
        const { error: insertImgErr } = await supabase
          .from('product_images')
          .insert(
            uploadedImagesMeta.map(meta => ({
              product_id: productId,
              storage_key: meta.storage_key,
              public_url: meta.public_url,
              display_order: meta.display_order
            }))
          );

        if (insertImgErr) throw insertImgErr;
      }

      // Re-order existing images that were NOT deleted
      const activeExisting = existingImages.filter(img => !img.isDeleted);
      for (const img of activeExisting) {
        await supabase
          .from('product_images')
          .update({ display_order: img.display_order })
          .eq('id', img.id);
      }

      // ----------------------------------------------------
      // STEP E: INVALIDATE CACHES AND REDIRECT
      // ----------------------------------------------------
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', pCode] });

      setLocation('/admin/products');
    } catch (err: any) {
      alert(`Save Failed: ${err.message || 'Error occurred during save operations.'}`);
    } finally {
      setSaving(false);
    }
  };

  const removePendingImage = (id: string) => {
    const target = pendingImages.find(img => img.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl); // Release memory
    
    const updated = pendingImages.filter(img => img.id !== id);
    // Reset order
    reorderImagesList(updated, existingImages);
  };

  const markExistingDeleted = (id: string) => {
    const updated = existingImages.map(img => {
      if (img.id === id) return { ...img, isDeleted: true };
      return img;
    });
    setExistingImages(updated);
    reorderImagesList(pendingImages, updated);
  };

  const reorderImagesList = (pending: ImageBlobItem[], existing: ExistingImage[]) => {
    let order = 0;
    
    // Sort and order existing active ones
    const updatedExisting = existing.map(img => {
      if (img.isDeleted) return img;
      return { ...img, display_order: order++ };
    });
    setExistingImages(updatedExisting);

    // Order pending ones
    const updatedPending = pending.map(img => ({
      ...img,
      display_order: order++
    }));
    setPendingImages(updatedPending);
  };

  const moveItemUp = (idx: number, type: 'pending' | 'existing') => {
    if (type === 'pending') {
      if (idx === 0) return;
      const copy = [...pendingImages];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      reorderImagesList(copy, existingImages);
    } else {
      if (idx === 0) return;
      const activeExisting = existingImages.filter(img => !img.isDeleted);
      const copy = [...activeExisting];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      
      // Merge back into state preserving deleted items
      const merged = existingImages.map(img => {
        if (img.isDeleted) return img;
        const newIdx = copy.findIndex(c => c.id === img.id);
        return copy[newIdx];
      });
      reorderImagesList(pendingImages, merged);
    }
  };

  if (isEditMode && loadingProduct) {
    return (
      <AdminLayout activeTab="products">
        <div className="text-center py-20 text-xs tracking-widest text-[#8C8C8C]">
          LOADING DESIGN DETAILS...
        </div>
      </AdminLayout>
    );
  }

  const activeExistingCount = existingImages.filter(img => !img.isDeleted).length;
  const totalImagesCount = activeExistingCount + pendingImages.length;

  return (
    <AdminLayout activeTab="products">
      <div className="space-y-8 font-sans">
        
        {/* Title Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-serif text-2xl tracking-wide uppercase">
              {isEditMode ? `Edit Product: ${params.code}` : 'Create Product'}
            </h2>
            <p className="text-xs text-[#8C8C8C] mt-1 font-light">
              {isEditMode ? 'Modify metadata and manage catalog gallery' : 'Configure sizing parameters and upload items'}
            </p>
          </div>
        </div>

        {/* The Form Panel */}
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns: Text Fields & Settings */}
          <div className="lg:col-span-2 bg-white border border-[#C5A880]/15 rounded-sm p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="font-serif text-lg tracking-wide uppercase text-neutral-800">Garment Details</h3>
            <div className="w-12 h-[1px] bg-[#C5A880] mb-4" />

            {/* Select Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8C8C8C]">Select Category *</label>
              <select
                required
                disabled={isEditMode}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-sm text-sm focus:outline-none focus:border-[#C5A880] disabled:bg-neutral-50"
              >
                <option value="">-- Choose Category --</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name} ({cat.code_prefix})</option>
                ))}
              </select>
            </div>

            {/* Optional Display Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8C8C8C]">Display Name (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Ivory Sherwani (Leave blank to use category + SKU code)"
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-sm text-sm focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8C8C8C]">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Craftsmanship highlights, fabrics, detailing..."
                className="w-full h-32 px-3 py-2 bg-white border border-neutral-300 rounded-sm text-sm focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Status Switch */}
            <div className="border-t border-neutral-100 pt-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#C5A880]"
                />
                <span className="text-xs uppercase tracking-widest text-[#1A1A1A]">Is Product Active (Publicly visible in browse and search)</span>
              </label>
            </div>

            {/* Submit Bar */}
            <div className="border-t border-neutral-100 pt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setLocation('/admin/products')}
                className="px-6 py-2.5 border border-neutral-300 text-xs tracking-widest uppercase hover:bg-neutral-50 rounded-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-10 py-2.5 bg-[#1A1A1A] hover:bg-[#C5A880] text-[#FAF9F6] text-xs font-semibold uppercase tracking-[0.2em] rounded-sm shadow-md transition-colors cursor-pointer disabled:bg-neutral-400"
              >
                {saving ? 'SAVING DATA...' : 'SAVE PRODUCT'}
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Image Uploader & Crop Tool */}
          <div className="bg-white border border-neutral-200 rounded-sm p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="font-serif text-lg tracking-wide uppercase text-neutral-800">Gallery Media</h3>
            <div className="w-12 h-[1px] bg-[#C5A880] mb-4" />

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8C8C8C] block">
                  Upload & Crop Image ({totalImagesCount} / 4)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={totalImagesCount >= 4 || !categoryId}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest bg-[#C5A880]/10 text-[#C5A880] hover:bg-[#C5A880]/20 rounded-sm border border-[#C5A880]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Choose File
                  </button>
                  <button
                    type="button"
                    disabled={totalImagesCount >= 4 || !categoryId}
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest bg-[#1A1A1A] text-[#FAF9F6] hover:bg-[#C5A880] rounded-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Take Photo
                  </button>
                </div>

                <p className="text-[9px] text-[#8C8C8C] leading-normal font-light pt-1 uppercase">
                  Fixed 800×1200 crop window · 1–4 images required · Max 5MB per upload · First image is primary
                </p>
                {!categoryId && (
                  <p className="text-[9px] text-amber-700 font-medium uppercase tracking-wide">Select a category first</p>
                )}
              </div>

              {/* Show items list */}
              {totalImagesCount > 0 && (
                <div className="space-y-3 pt-4 border-t border-neutral-100">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8C8C8C]">Staged Gallery ({totalImagesCount} / 4)</span>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {/* Render active existing images */}
                    {existingImages.filter(img => !img.isDeleted).map((img, idx) => (
                      <div key={img.id} className="flex items-center justify-between border border-neutral-200 p-2 rounded bg-neutral-50/50">
                        <div className="flex items-center gap-3">
                          <img src={img.public_url} alt="Staged" className="w-8 h-12 object-cover rounded-sm border border-neutral-200" />
                          <div className="text-[10px] uppercase font-mono tracking-wider">
                            <span className="text-[#C5A880] font-semibold">{idx === 0 ? 'Primary' : `Image ${idx + 1}`}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveItemUp(idx, 'existing')}
                            className="text-[10px] uppercase tracking-wider text-neutral-500 hover:text-black hover:underline cursor-pointer disabled:opacity-30"
                          >
                            ▲ Up
                          </button>
                          <button
                            type="button"
                            onClick={() => markExistingDeleted(img.id)}
                            className="text-[10px] uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Render pending images */}
                    {pendingImages.map((img, idx) => {
                      const absoluteIdx = activeExistingCount + idx;
                      return (
                        <div key={img.id} className="flex items-center justify-between border border-neutral-200 p-2 rounded bg-neutral-50/50">
                          <div className="flex items-center gap-3">
                            <img src={img.previewUrl} alt="Pending" className="w-8 h-12 object-cover rounded-sm border border-neutral-200" />
                            <div className="text-[10px] uppercase font-mono tracking-wider">
                              <span className="text-[#C5A880] font-semibold">{absoluteIdx === 0 ? 'Primary' : `Image ${absoluteIdx + 1}`}</span>
                              <span className="text-neutral-400 ml-2 font-sans font-light">(Staged)</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={absoluteIdx === 0}
                              onClick={() => moveItemUp(idx, 'pending')}
                              className="text-[10px] uppercase tracking-wider text-neutral-500 hover:text-black hover:underline cursor-pointer disabled:opacity-30"
                            >
                              ▲ Up
                            </button>
                            <button
                              type="button"
                              onClick={() => removePendingImage(img.id)}
                              className="text-[10px] uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* ---------------------------------------------------- */}
        {/* INTERACTIVE CROP MODAL OVERLAY                       */}
        {/* ---------------------------------------------------- */}
        {cropImgSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
            <div className="bg-[#FAF9F6] rounded-sm p-4 sm:p-6 w-full max-w-2xl border border-[#C5A880]/20 flex flex-col space-y-4 sm:space-y-6 max-h-[95vh] overflow-y-auto">
              
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200 gap-3">
                <div>
                  <h3 className="font-serif text-base sm:text-lg uppercase tracking-wide">Crop & Zoom</h3>
                  <p className="text-[10px] text-[#8C8C8C] tracking-wide uppercase font-light mt-0.5">
                    Fixed {cropSettings.width}×{cropSettings.height} portrait
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCropImgSrc('')}
                  className="text-neutral-500 hover:text-black cursor-pointer font-light text-sm shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="flex justify-center bg-[#111] border border-neutral-800 p-1 relative rounded-sm shadow-inner select-none overflow-hidden h-[45vh] sm:h-[400px] touch-none">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={380}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="cursor-move w-full h-full"
                />
                <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto bg-black/60 text-[#FAF9F6] text-[9px] tracking-widest px-3 py-1.5 rounded uppercase pointer-events-none text-center sm:text-left">
                  Drag to pan · Pinch or use zoom slider
                </div>
              </div>

              {/* Zoom slider */}
              <div className="space-y-2 bg-white border border-neutral-200 rounded p-4">
                <div className="flex justify-between text-xs tracking-wider uppercase text-[#8C8C8C] font-semibold mb-1">
                  <span>Zoom Level</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-[#C5A880]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setCropImgSrc('')}
                  className="px-6 py-2.5 border border-neutral-300 text-xs tracking-widest uppercase hover:bg-neutral-100 rounded-sm cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleCrop}
                  className="px-10 py-2.5 bg-[#C5A880] text-[#FAF9F6] text-xs font-semibold uppercase tracking-[0.2em] rounded-sm shadow-md hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Apply Crop
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
export default ProductForm;
