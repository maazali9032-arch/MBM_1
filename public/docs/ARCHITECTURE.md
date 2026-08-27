# Architecture

## Overview

Junaid Textiles is a **React 19 + Vite 7** single-page application with a dynamic product catalogue and owner admin panel. The public homepage preserves the premium one-page design; catalogue and admin features are added via new routes.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7 |
| Routing | Wouter |
| Styling | Tailwind CSS v4, shadcn/ui (Radix) |
| Animation | Framer Motion (homepage) |
| Data fetching | TanStack React Query (`useQuery`, `useInfiniteQuery`) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Object storage | Cloudflare R2 (WEBP images) |
| Upload API | Cloudflare Worker (JWT + `admin_users` check) |
| Image processing | Browser Canvas API (crop, resize, WEBP) |
| Deployment (frontend) | Vercel (`vercel.json` SPA rewrites, Speed Insights) |

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Public Website (Vite SPA)                 │
│  Home · /collections/:slug · /products/:code · /search    │
│  Infinite scroll · detail gallery · zoom lightbox           │
└──────────────────────────┬──────────────────────────────────┘
                           │ read (anon key + RLS)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│  PostgreSQL (categories, products, product_images)          │
│  Auth (admin users) · RLS · RPCs (codes, search, categories)│
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    Admin Panel (/admin/*)                    │
│  Login · Reset password · Products · Categories · Images    │
└──────────┬───────────────────────────────┬────────────────────┘
           │ mutate (auth + RLS)          │ upload processed WEBP
           ▼                              ▼
    Supabase DB                   Cloudflare Worker
                                         │
                                         ▼
                                   Cloudflare R2
                          products/{slug}/{product-id}/{image-id}.webp
```

## Route Architecture

| Route | Purpose |
|-------|---------|
| `/` | Homepage (hero, collections, about, visit us) |
| `/collections/:slug` | Category product grid (infinite scroll) |
| `/products/:code` | Product detail (swipe gallery + zoom lightbox) |
| `/search` | Catalogue search (infinite scroll) |
| `/custom-orders` | Custom tailoring enquiry |
| `/admin` | Admin dashboard (auth required) |
| `/admin/login` | Supabase Auth login |
| `/admin/reset-password` | New password after email reset link |
| `/admin/products` | Product list (filter, publish, delete) |
| `/admin/products/new` | Add product |
| `/admin/products/:id/edit` | Edit product |
| `/admin/categories` | Category management |

## Layout & Chrome Rules

Defined in `src/lib/routes.ts`:

| Route type | Navbar | Footer (map + links) | WhatsApp FAB |
|------------|--------|----------------------|--------------|
| Home `/` | Yes | Yes | Yes |
| Catalogue (`/collections/*`, `/products/*`, `/search`, `/custom-orders`) | Yes | **No** | Yes |
| Admin `/admin/*` | **No** | **No** | **No** |

- `ScrollToTop` (`src/components/ScrollToTop.tsx`) scrolls to top on every route change.
- Catalogue pages use `CATALOGUE_PAGE_CLASS` (`src/lib/layout.ts`) for navbar + FAB clearance (`pb-24`).

## Public Catalogue Behaviour

| Feature | Implementation |
|---------|----------------|
| Category grid | `useInfiniteProducts` — 24 products per page (`CATALOGUE_PAGE_SIZE`) |
| Search results | `useInfiniteSearchProducts` — same page size |
| List performance | Primary image only (`display_order = 0`) on grid/search queries |
| Product cards | Image + name link to `/products/:code` — **no lightbox on grid** |
| Product detail | Swipe gallery, tap to open `ImageLightbox` (pinch/scroll zoom) |
| Category switcher | Horizontal scroll pills on category pages |
| Navbar mobile | Hamburger `Sheet` menu below `lg` breakpoint |

## Key Design Decisions

1. **Homepage preserved** — Hero, sections, and brand design unchanged; catalogue added as routes.
2. **Client-side image processing** — Crop/resize/WEBP in browser before upload; Worker stays simple.
3. **Category-level image config** — Aspect ratio and dimensions in `categories` table.
4. **Stable product codes** — `JT-SHW-001` via `generate_product_code()`; codes never change after creation.
5. **Portable configuration** — All credentials via environment variables.
6. **Paginated catalogue** — Never load all products at once; infinite scroll for large inventories.

## Directory Structure

```
docs/                         # Documentation (see CATALOGUE_BLUEPRINT.md for reuse)
supabase/migrations/          # Versioned SQL schema (001–004)
supabase/RUN_CATEGORY_FIX.sql # Combined 003+004 shortcut
workers/image-upload/         # Cloudflare Worker for R2
src/
  lib/
    config.ts                 # VITE_* env reads
    supabase.ts               # Client singleton
    layout.ts                 # CATALOGUE_PAGE_CLASS
    routes.ts                 # Footer/chrome visibility rules
    products.ts               # getPrimaryImage, display names
    whatsapp.ts               # Enquiry message builders
    auth-redirect.ts          # Password reset URL
    auth-recovery.ts          # PKCE + hash token handling
    image-processing.ts       # Crop, WEBP, camera helpers
    upload.ts                 # Worker upload/delete
  types/database.ts
  hooks/
    useAuth.ts                # AuthProvider
    useCategories.ts
    useProducts.ts            # Infinite + standard queries
    useInfiniteScroll.ts      # IntersectionObserver sentinel
    useSwipeCarousel.ts       # Touch swipe + tap vs swipe detection
  components/
    Navbar.tsx                # Desktop nav + mobile Sheet menu
    Footer.tsx                # Home only
    ScrollToTop.tsx
    admin/                    # AdminGuard, ImageManager, headers
    catalogue/                # ProductCard, galleries, lightbox, infinite grid
  pages/
    Home.tsx
    Search.tsx
    CustomOrders.tsx
    collections/              # CategoryPage, ProductDetailPage
    admin/                    # Login, products, categories, dashboard
```

## Portability

Move to a new Supabase project, Cloudflare account, R2 bucket, and domain by updating environment variables only. For replicating the same system for another brand, see [`CATALOGUE_BLUEPRINT.md`](./CATALOGUE_BLUEPRINT.md).

## Related Docs

| Doc | Contents |
|-----|----------|
| [`DATABASE.md`](./DATABASE.md) | Schema, migrations, RPCs |
| [`IMAGE_PIPELINE.md`](./IMAGE_PIPELINE.md) | Crop, WEBP, R2 |
| [`ADMIN.md`](./ADMIN.md) | Owner workflows |
| [`SECURITY.md`](./SECURITY.md) | RLS, upload auth |
| [`ENVIRONMENT.md`](./ENVIRONMENT.md) | Env vars |
| [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md) | Full rebuild runbook |
