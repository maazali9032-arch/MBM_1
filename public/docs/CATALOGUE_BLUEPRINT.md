# Reusable Catalogue System Blueprint

**Purpose:** This document is the single source of truth for rebuilding the same product-catalogue + admin architecture for a **new client** with different branding, design, CSS, and animations — without re-explaining workflows.

**Reference implementation:** Junaid Textiles (`E:\Projects\LEADS\13.Junaid-textiles`)

**How to use:**
1. Copy this file to the new project’s `docs/` folder.
2. Fill in the **Client Variables** section below.
3. Give this entire file (or link to it) to a developer or AI agent with: *“Implement this blueprint. Brand/design is custom; logic and architecture must match.”*
4. Use the **AI Kickoff Prompt** at the bottom as your starting message.

---

## Client Variables (fill per project)

| Variable | Example (Junaid) | New client |
|----------|------------------|------------|
| `{BRAND_NAME}` | Junaid Textiles | |
| `{CODE_PREFIX}` | JT | |
| `{DOMAIN}` | junaidtextiles.com | |
| `{WHATSAPP_NUMBER}` | 918978678653 | |
| `{R2_BUCKET}` | junaid-textiles-media | |
| `{WORKER_NAME}` | junaid-image-upload | |
| `{SUPABASE_PROJECT}` | trwywpsvkieaogodcxvz | |
| `{MAX_IMAGES_PER_PRODUCT}` | 4 | |
| `{CATALOGUE_PAGE_SIZE}` | 24 | |
| `{DEFAULT_ASPECT_RATIO}` | 3:4 | |
| `{DEFAULT_IMAGE_WIDTH}` | 1200 | |
| `{DEFAULT_IMAGE_HEIGHT}` | 1600 | |

**What changes per client:** fonts, colours, homepage layout, animations, logo, copy, category seed data, WhatsApp number, env credentials, bucket name.

**What stays the same:** database shape, RLS model, image pipeline, admin flows, public catalogue behaviour, upload security, pagination strategy.

---

## 1. Product Summary

Build a **React SPA** with:

### Public (customer-facing)
- Marketing homepage (design is custom per client)
- **Category pages** — grid of products, infinite scroll
- **Product detail** — swipe gallery, tap to enlarge, pinch/scroll zoom
- **Search** — by name/code, paginated results
- **WhatsApp enquiry** — per product + general FAB
- Mobile-first responsive (320px → desktop)
- Scroll to top on route change

### Admin (owner-facing)
- Email/password login + forgot password + reset password page
- Dashboard with quick links
- **Categories** — add/edit/delete/reorder, image crop config per category
- **Products** — add/edit/delete, publish/unpublish, list with filter
- **Images** — upload from device OR camera, fixed crop window per category, WEBP conversion, 1–4 images, drag reorder, set featured (primary) image
- Mobile-friendly admin (touch targets ≥ 44px, camera on phone)

### Infrastructure
- **Supabase** — PostgreSQL + Auth + RLS
- **Cloudflare R2** — image storage (WEBP only)
- **Cloudflare Worker** — authenticated upload/delete (secrets never in browser)
- **Vercel** (or similar) — frontend hosting

---

## 2. Tech Stack (do not substitute without reason)

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7 |
| Routing | Wouter |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix) |
| Data | TanStack React Query |
| Animation | Framer Motion (public pages only — optional per design) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Cloudflare R2 |
| Upload API | Cloudflare Worker |
| Image processing | Browser Canvas API (crop, resize, WEBP) |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Public SPA (Vite)                               │
│  / · /collections/:slug · /products/:code · /search       │
└──────────────────────────┬──────────────────────────────────┘
                           │ read (anon key + RLS)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│  categories · products · product_images · admin_users       │
│  Auth · RLS · RPCs (product code, category create, search)  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    Admin (/admin/*)                          │
│  Login · Reset password · Products · Categories · Images    │
└──────────┬───────────────────────────────┬──────────────────┘
           │ mutate (JWT + RLS)             │ POST processed WEBP
           ▼                                ▼
    Supabase DB                     Cloudflare Worker
                                           │
                                           ▼
                                     Cloudflare R2
                          products/{category-slug}/{product-id}/{image-id}.webp
```

**Rule:** Images are **never** stored in Supabase. Only `storage_key` + `public_url` in `product_images`.

---

## 4. Database Schema

Apply migrations in order from `supabase/migrations/`.

### Tables

#### `categories`
- `id`, `name`, `slug` (unique), `description`, `image_url` (optional card image)
- `code_prefix` — e.g. `JT-SHW` for product codes
- `image_aspect_ratio`, `image_width`, `image_height`, `crop_position` — **per-category crop config**
- `display_order`, `is_active`, timestamps

#### `products`
- `id`, `category_id` (FK), `product_code` (unique), `name` (optional), `description`
- `is_active` (publish flag), `display_order`, timestamps

#### `product_images`
- `id`, `product_id` (FK, cascade delete), `storage_key`, `public_url`
- `alt_text`, `display_order` (**0 = featured/primary image**)
- **Trigger:** max `{MAX_IMAGES_PER_PRODUCT}` per product

#### `category_code_sequences`
- `category_id`, `last_sequence` — atomic counter for product codes

#### `admin_users`
- `id` (FK → `auth.users`), `email`

### Product code generation
- RPC: `generate_product_code(category_id)`
- Format: `{PREFIX}-{NNN}` e.g. `JT-SHW-014`
- Lock sequence row `FOR UPDATE`, increment, pad to 3 digits
- **Codes are stable** after creation — changing category does not change code

### Category creation
- RPC: `admin_create_category(...)` with `SECURITY DEFINER` if RLS blocks sequence insert
- Run `003` + `004` migrations (or combined `RUN_CATEGORY_FIX.sql`)

### Search
- RPC: `search_products(p_query)` with GIN/trigram fallback to `ilike` on name + code

### RLS summary
| Role | categories | products | product_images |
|------|------------|----------|----------------|
| Public | `is_active = true` | `is_active = true` | via active product |
| Admin (in `admin_users`) | full CRUD | full CRUD | full CRUD |

---

## 5. Environment Variables

```env
# Frontend (Vite)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_R2_PUBLIC_URL=          # R2 public bucket base URL
VITE_UPLOAD_API_URL=         # Worker deploy URL
VITE_WHATSAPP_NUMBER=
VITE_SITE_URL=               # For password-reset redirect URLs

# Worker only (never in frontend)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
R2_PUBLIC_URL=
```

**Supabase Auth redirect URLs to add:**
- `{VITE_SITE_URL}/admin/reset-password` (localhost + production)

---

## 6. Image Pipeline (mandatory behaviour)

```
INPUT (JPG/PNG/HEIC/WebP, ≤ 15MB)
  → validate type/size
  → load to Canvas
  → crop to category aspect ratio (interactive drag/zoom OR camera frame overlay)
  → resize to category width × height (max ~1200px longest side)
  → compress WEBP (~0.85 quality)
  → upload via Worker (JWT required)
  → save metadata to product_images
```

### Upload sources (admin `ImageManager`)
1. **Upload from device** — `<input type="file" accept="image/*">` portaled to `document.body` (fixes mobile Safari)
2. **Take photo** — `getUserMedia`, preview with category aspect-ratio frame overlay

### Image manager features
- Preview grid with crop step before add
- Remove, reorder (drag on desktop; up/down or drag on mobile)
- **Star / primary** — `display_order: 0` is featured image (used on catalogue cards)
- Counter: `Images: X / {MAX}`
- Cannot publish without ≥ 1 image
- Cannot add beyond max (UI + DB trigger)

### R2 key pattern
```
products/{category-slug}/{product-id}/{image-id}.webp
```

### Public URL
```
{VITE_R2_PUBLIC_URL}/products/{category-slug}/{product-id}/{image-id}.webp
```

### Key files to replicate
- `src/lib/image-processing.ts` — crop, resize, WEBP, camera helpers
- `src/lib/upload.ts` — Worker POST/DELETE with auth header
- `src/components/admin/ImageManager.tsx` — full upload UI
- `workers/image-upload/` — Cloudflare Worker

---

## 7. Admin Workflows

### 7.1 Authentication
| Flow | Route | Behaviour |
|------|-------|-----------|
| Login | `/admin/login` | Email + password; redirect to `/admin` if session exists |
| Forgot password | `/admin/login` | `resetPasswordForEmail` → email link |
| Reset password | `/admin/reset-password` | Handle `?code=` PKCE + hash recovery tokens |
| Guard | all `/admin/*` except login/reset | `AdminGuard` checks session + `admin_users` row |
| Logout | dashboard | `signOut()` |

**First admin setup (manual):**
1. Create user in Supabase Auth dashboard
2. `INSERT INTO admin_users (id, email) VALUES (auth_user_id, email)`

### 7.2 Category management (`/admin/categories`)
- List all categories (active + inactive)
- Add: name, slug (auto from name), description, code prefix, aspect ratio, dimensions
- Edit / deactivate / delete (safe delete dialog if products exist)
- Reorder via `display_order`

### 7.3 Product list (`/admin/products`)
- List all products (published + drafts)
- Filter by name/code
- Publish / unpublish toggle
- Delete (also delete R2 objects via Worker)
- Link to edit

### 7.4 Add product (`/admin/products/new`)
**No `<form>` wrapper** — use `type="button"` + handlers (prevents accidental mobile submit)

1. Select **category** (required dropdown)
2. Optional **name** and **description**
3. **Images** via ImageManager (category config drives crop)
4. **Publish toggle** — ON = `is_active: true`
5. Save:
   - RPC `generate_product_code`
   - Insert product
   - Upload each image → insert `product_images` with `display_order`
   - Invalidate React Query caches

### 7.5 Edit product (`/admin/products/:id/edit`)
- Same fields as add
- Can change category, name, description, images
- Reorder images → update `display_order` (0 = primary)
- Add new images / delete old (delete from R2 + DB)
- Product code **never changes**

### 7.6 Admin UI language (non-technical owner)
- “Publish” / “Hide from website” (not `is_active`)
- “Take Photo” / “Upload Images”
- “Add Product” (not “Create record”)

---

## 8. Public Catalogue Workflows

### 8.1 Routes
| Route | Purpose |
|-------|---------|
| `/` | Homepage (custom design) |
| `/collections/:slug` | Category product grid |
| `/products/:code` | Product detail |
| `/search?q=` | Search results |
| `/custom-orders` | Optional enquiry page |

**Layout rules:**
- Catalogue routes: show navbar + WhatsApp FAB, **hide** full footer/map
- Home: show navbar + footer + FAB
- Admin: no public chrome

### 8.2 Category page
- Header: category name, description, total product count
- **Category switcher** — horizontal scroll pills
- **Infinite scroll grid** — load `{CATALOGUE_PAGE_SIZE}` products per batch
- **Primary image only** per card (query `display_order = 0`) — performance
- Card: image + name + code → **both link to product page** (no lightbox on grid)
- WhatsApp enquire button per card

### 8.3 Product detail page
- Image gallery: swipe between images
- **Tap main image or thumbnail → fullscreen lightbox**
- Lightbox: pinch/scroll zoom, pan when zoomed, swipe between images when not zoomed, keyboard arrows + Escape
- Product info + WhatsApp CTA

### 8.4 Search
- Min 2 characters
- Infinite scroll, primary image only
- RPC search with ilike fallback

### 8.5 Performance rules
- **Never** load all products at once — use `useInfiniteQuery` + `range()` pagination
- **Never** load all images per product on grid — primary only
- Lazy-load card images (`loading="lazy"`)
- Full images only on product detail page

---

## 9. Frontend File Checklist (replicate this structure)

```
src/
  lib/
    config.ts              # isSupabaseConfigured, env reads
    supabase.ts              # client singleton
    layout.ts                # CATALOGUE_PAGE_CLASS (navbar + FAB clearance)
    routes.ts                # shouldShowFooter, isCatalogueRoute, etc.
    products.ts              # getPrimaryImage, getProductDisplayName, slugify
    whatsapp.ts              # enquiry message builders
    auth-redirect.ts         # password reset URL
    auth-recovery.ts         # PKCE + hash token handling
    image-processing.ts      # crop, WEBP, camera
    upload.ts                # Worker upload/delete

  types/database.ts          # Category, Product, ProductImage, AdminUser

  hooks/
    useAuth.ts               # AuthProvider, session, isAdmin
    useCategories.ts
    useProducts.ts           # useProducts, useInfiniteProducts, useProductByCode, useInfiniteSearchProducts
    useInfiniteScroll.ts     # IntersectionObserver sentinel
    useSwipeCarousel.ts      # touch swipe + consumeSwipe for tap vs swipe

  components/
    Navbar.tsx               # desktop nav + mobile Sheet menu
    Footer.tsx               # home only; custom per brand
    ScrollToTop.tsx          # scroll window on route change
    admin/
      AdminGuard.tsx
      AdminHeader.tsx
      AdminBackNav.tsx
      ImageManager.tsx       # upload, camera, crop, reorder, primary
    catalogue/
      ProductCard.tsx
      ProductImageGallery.tsx
      ImageLightbox.tsx
      InfiniteProductGrid.tsx
      CatalogueHeader.tsx
      CategorySwitcher.tsx
      SearchBar.tsx

  pages/
    Home.tsx                 # CUSTOM per client
    Search.tsx
    CustomOrders.tsx         # optional
    collections/
      CategoryPage.tsx
      ProductDetailPage.tsx
    admin/
      Login.tsx
      ResetPassword.tsx
      Dashboard.tsx
      Products.tsx
      AddProduct.tsx
      EditProduct.tsx
      Categories.tsx

supabase/migrations/         # 001–004 + seed
workers/image-upload/        # Worker + wrangler.toml
vercel.json                  # SPA rewrites
.env.example
```

---

## 10. React Query Keys

| Key | Purpose |
|-----|---------|
| `['categories', activeOnly]` | Category list |
| `['products', categoryId, activeOnly, primaryImageOnly]` | Admin / full list |
| `['products', 'infinite', categoryId, pageSize]` | Public category pagination |
| `['product', code]` | Product detail (all images) |
| `['search', 'infinite', query, pageSize]` | Search pagination |

**Invalidate** `['products']`, `['product']`, `['search']` after any product/image mutation.

---

## 11. Responsive Requirements

| Breakpoint | Grid | Nav |
|------------|------|-----|
| Mobile <768px | 2 columns | Hamburger menu |
| Tablet 768–1023px | 3 columns | Hamburger menu |
| Desktop ≥1024px | 4 columns | Full horizontal nav |

**Must-haves:**
- `overflow-x: clip` on body
- `CATALOGUE_PAGE_CLASS` — `pt-24 pb-24` clears fixed navbar + WhatsApp FAB
- `ScrollToTop` on every route change
- Footer mobile: Explore centered, Experience + Connect side-by-side
- Touch targets ≥ 44px on admin + lightbox
- Safe-area insets on FAB: `env(safe-area-inset-bottom)`
- Viewport: `width=device-width, initial-scale=1` (no `maximum-scale=1`)

---

## 12. Security Checklist

- [ ] RLS enabled on all tables
- [ ] `admin_users` gate for all writes
- [ ] Worker verifies JWT + `admin_users` membership
- [ ] R2 secrets only in Worker binding / secrets (not frontend)
- [ ] Service role key only in Worker
- [ ] Password reset uses `VITE_SITE_URL`
- [ ] User-friendly error messages (no stack traces)

---

## 13. Deployment Checklist (new client)

1. Create Supabase project → run migrations 001–004
2. Create R2 bucket → enable public access → note URL
3. Deploy Worker → set secrets → note URL
4. Create Vercel project → set all `VITE_*` env vars
5. Add Supabase redirect URLs for password reset
6. Create first admin in Auth + `admin_users`
7. Seed or add categories via admin
8. Test: add product with camera + upload on mobile
9. Test: public grid, detail zoom, search, infinite scroll

**Full rebuild runbook:** see `DISASTER_RECOVERY.md` in reference repo.

---

## 14. What Is Custom Per Client (design only)

These files/areas are **replaced or restyled** — logic hooks into the same data layer:

- `Home.tsx` — hero, sections, animations, copy
- `Navbar.tsx` / `Footer.tsx` — visual design (keep route links + mobile menu behaviour)
- `index.css` — CSS variables: colours, fonts, `--footer-background`
- Logo and image assets in `src/assets/`
- Category seed data and copy
- WhatsApp messages in `lib/whatsapp.ts`

**Do not change** without good reason: `useProducts.ts`, `ImageManager.tsx`, `image-processing.ts`, `workers/`, migrations, RLS policies.

---

## 15. AI Kickoff Prompt (copy-paste for new client)

```
Build a product catalogue web app using the attached CATALOGUE_BLUEPRINT.md.

Client details:
- Brand: {BRAND_NAME}
- Domain: {DOMAIN}
- Code prefix: {CODE_PREFIX}
- WhatsApp: {WHATSAPP_NUMBER}
- Design: [describe or attach mockups — fonts, colours, mood]

Requirements:
1. Follow the blueprint architecture EXACTLY (Supabase + R2 + Worker + image pipeline).
2. Custom homepage and branding only — all catalogue/admin logic must match the blueprint.
3. Admin: login, forgot password, categories, products, camera/upload, WEBP crop, featured image, publish toggle.
4. Public: category grid with infinite scroll, product detail with swipe + zoom lightbox, search.
5. Grid cards link to product page only (no lightbox on grid). Primary image only on list queries.
6. Mobile-first responsive per blueprint section 11.
7. Include supabase migrations, Worker, .env.example, and vercel.json.

Start by scaffolding the project structure from blueprint section 9, then database migrations, then Worker, then admin, then public catalogue.
```

---

## 16. Related Docs (reference repo)

| Doc | Contents |
|-----|----------|
| `ARCHITECTURE.md` | Stack overview |
| `DATABASE.md` | Schema detail |
| `IMAGE_PIPELINE.md` | Image stages |
| `ADMIN.md` | Admin UX flows |
| `SECURITY.md` | RLS + Worker auth |
| `ENVIRONMENT.md` | Env setup |
| `DISASTER_RECOVERY.md` | Full rebuild from zero |
| `IMPLEMENTATION_STATUS.md` | Feature checklist |

---

*Blueprint version: 1.1 — synced with Junaid Textiles implementation, August 2026.*
