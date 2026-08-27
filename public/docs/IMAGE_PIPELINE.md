# Image Pipeline

## Overview

Every product image passes through a processing pipeline **before** upload to R2. Final stored format is always **WEBP**.

## Pipeline Stages

```
INPUT (JPG/JPEG/PNG/HEIC/WebP)
    ↓
1. Validate file (type, size ≤ 15MB input)
    ↓
2. Load into Canvas / ImageBitmap
    ↓
3. Crop to category aspect ratio (from categories table)
    ↓
4. Resize to category image_width × image_height (max 1200px longest side)
    ↓
5. Compress (WEBP quality ~0.85)
    ↓
6. Convert to WEBP (actual binary conversion via canvas.toBlob)
    ↓
7. Upload to R2 via authenticated Worker
    ↓
8. Store metadata in product_images table
```

## Category Image Configuration

Stored per category in the database:

| Field | Example | Purpose |
|-------|---------|---------|
| `image_aspect_ratio` | `3:4` | Crop target ratio |
| `image_width` | `1200` | Output width |
| `image_height` | `1600` | Output height |
| `crop_position` | `center` | Crop anchor |

Components read config from the selected category — **not hardcoded** in React.

## Upload Sources

### A. Upload from Device
- File input accepting `image/*`
- Processes through pipeline before upload

### B. Camera Capture
- `getUserMedia` for rear camera on mobile
- Preview constrained to category aspect ratio
- Frame overlay guides the owner: "Keep the product inside this frame"
- Captured frame cropped to configured ratio before pipeline continues

## Limits

| Rule | Enforcement |
|------|-------------|
| Minimum 1 image to publish | Frontend UI only (`canPublish` — save blocked without images) |
| Maximum 4 images per product | Frontend UI + DB trigger `enforce_max_product_images` |
| No duplicate originals in R2 | Only processed WEBP uploaded |
| Lazy loading on public site | `loading="lazy"` on product cards |
| Primary image on grids | Queries fetch `display_order = 0` only for list/search performance |
| Full gallery on detail | `useProductByCode` loads all images for product page |
| Zoom lightbox | Product detail page only — grid cards link to detail, no grid lightbox |

## R2 Storage Key Structure

```
products/{category-slug}/{product-id}/{image-id}.webp
```

Example:
```
products/sherwanis/a1b2c3d4-e5f6-7890-abcd-ef1234567890/f9e8d7c6-b5a4-3210-fedc-ba9876543210.webp
```

## Public URL

```
{VITE_R2_PUBLIC_URL}/products/sherwanis/{product-id}/{image-id}.webp
```

Configure `VITE_R2_PUBLIC_URL` to your R2 public bucket URL for `junaid-textiles-media` or custom domain.

## Performance Targets

- Output: ~100–300 KB per image (visually high quality)
- Max resolution: 1200px on longest side (category configurable)
- Format: WEBP only in R2
- No 8–15 MB originals stored

## Error Handling

| Error | User Message |
|-------|--------------|
| Unsupported file type | "Please upload a JPG, PNG, or HEIC image." |
| File too large | "Image is too large. Please use a smaller photo." |
| Camera permission denied | "Camera access is required to take photos." |
| Camera unavailable | "Camera is not available on this device." |
| Upload failed | "Upload failed. Please check your connection and try again." |
| Max images reached | "Maximum 4 images per product." |
