# Disaster Recovery & Full Infrastructure Rebuild Guide

**Purpose:** If you lose access to Supabase, Cloudflare, domain accounts, or local `.env` files, this document is the single runbook to recreate the **entire Junaid Textiles catalogue stack** from this repository alone.

**Last audited:** 2026-08-25  
**Repository:** `Junaid-textiles` (React + Vite frontend, Supabase backend, Cloudflare R2 + Worker for images)

---

## Table of Contents

1. [What This Project Uses](#1-what-this-project-uses)
2. [Current Deployment Inventory](#2-current-deployment-inventory)
3. [Secrets & Credentials Checklist](#3-secrets--credentials-checklist)
4. [Rebuild From Scratch (Ordered Steps)](#4-rebuild-from-scratch-ordered-steps)
5. [Supabase — Full Setup](#5-supabase--full-setup)
6. [Database Migrations](#6-database-migrations)
7. [Cloudflare — Full Setup](#7-cloudflare--full-setup)
8. [Frontend Environment](#8-frontend-environment)
9. [Admin Auth & Password Reset](#9-admin-auth--password-reset)
10. [Verification Checklist](#10-verification-checklist)
11. [Backup & Data Recovery](#11-backup--data-recovery)
12. [Related Documentation](#12-related-documentation)

---

## 1. What This Project Uses

| Service | Role | Data stored |
|---------|------|-------------|
| **Supabase** | PostgreSQL database, Auth, RLS | Categories, products, image metadata, admin users |
| **Cloudflare R2** | Object storage | Product images (WEBP only) |
| **Cloudflare Worker** | Upload/delete API | No persistent data — proxies to R2 |
| **Vercel** (or similar) | Frontend hosting | Static SPA build |
| **Domain DNS** | Public website | Points to Vercel / custom domain |

**Architecture rule:** Images are **never** stored in Supabase. Only `storage_key` + `public_url` metadata in `product_images`. Uploads go: Browser → Worker → R2.

See also: [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## 2. Current Deployment Inventory

> **Update this section** whenever you change accounts, URLs, or resource names.

| Resource | Current value | Where configured |
|----------|---------------|------------------|
| Supabase project ref | `trwywpsvkieaogodcxvz` | Supabase dashboard URL |
| Supabase project URL | `https://trwywpsvkieaogodcxvz.supabase.co` | `.env`, `wrangler.toml` |
| R2 bucket name | `junaid-textiles-media` | `wrangler.toml` |
| R2 public URL | `https://pub-e75072498f9845a3b8ba2cb070d1867a.r2.dev` | `wrangler.toml`, `.env` |
| Worker name | `junaid-image-upload` | `wrangler.toml` |
| Worker URL | `https://junaid-image-upload.<account>.workers.dev` | Set after `wrangler deploy` → `.env` as `VITE_UPLOAD_API_URL` |
| Frontend dev port | `5173` | Vite default |
| WhatsApp number | `918978678653` | `.env` `VITE_WHATSAPP_NUMBER` |
| Git repo | Local / GitHub / Cursor-hosted | — |

---

## 3. Secrets & Credentials Checklist

**Store these in a password manager** (1Password, Bitwarden, etc.). **Never commit to git.**

| Secret | Used by | Where to get it |
|--------|---------|-----------------|
| Supabase `anon` key | Frontend `.env` | Supabase → Project Settings → API → `anon` `public` |
| Supabase `service_role` key | Worker only | Supabase → Project Settings → API → `service_role` `secret` |
| Cloudflare account login | Dashboard | cloudflare.com |
| Wrangler OAuth / API token | `wrangler login` / deploy | Cloudflare dashboard |
| R2 User API token (optional) | External S3 tools, backups | Cloudflare → R2 → Manage API tokens |
| Vercel / hosting login | Frontend deploy | vercel.com (or your host) |
| Domain registrar login | DNS | Your domain provider |
| Admin owner email + password | `/admin/login` | Supabase Auth user you create |

### Safe to commit (in repo)

- `supabase/migrations/*.sql` — schema
- `workers/image-upload/wrangler.toml` — non-secret vars (URL, bucket name)
- `.env.example` — placeholders only
- All application source code

### Never commit

- `.env` (project root)
- `workers/image-upload/.dev.vars`
- Supabase `service_role` key
- R2 API token secrets

---

## 4. Rebuild From Scratch (Ordered Steps)

Use this checklist when starting completely fresh:

```
□ 1. Clone / restore this repository
□ 2. Create new Supabase project
□ 3. Run all SQL migrations (Section 6) in order
□ 4. Enable Supabase Email auth + configure redirect URLs (Section 9)
□ 5. Create admin Auth user + insert into admin_users (Section 5.4)
□ 6. Create Cloudflare R2 bucket: junaid-textiles-media
□ 7. Enable R2 public access → copy pub-*.r2.dev URL
□ 8. Deploy Cloudflare Worker (Section 7)
□ 9. Set Worker secret: SUPABASE_SERVICE_ROLE_KEY
□ 10. Create project root .env from .env.example (Section 8)
□ 11. npm install && npm run dev — test locally
□ 12. Deploy frontend to Vercel (or host of choice)
□ 13. Run verification checklist (Section 10)
```

**Estimated time:** 1–2 hours if familiar with Supabase + Cloudflare.

---

## 5. Supabase — Full Setup

### 5.1 Create project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → choose org, name (e.g. `junaid-textiles`), region (pick closest to Hyderabad users, e.g. Mumbai/Singapore if available)
3. Save the **database password** in your password manager
4. Wait for project to finish provisioning

### 5.2 Get API credentials

**Project Settings → API:**

| Key | Copy to |
|-----|---------|
| Project URL | `VITE_SUPABASE_URL`, Worker `SUPABASE_URL` |
| `anon` `public` | `VITE_SUPABASE_ANON_KEY` |
| `service_role` `secret` | Worker secret only — **never frontend** |

### 5.3 Enable Authentication

**Authentication → Providers:**

- Enable **Email** provider
- (Recommended) Disable public sign-ups if you only want invited admins:
  - Authentication → Settings → disable "Allow new users to sign up" OR only create users manually in dashboard

**Authentication → URL Configuration:**

| Setting | Development | Production |
|---------|-------------|------------|
| Site URL | `http://localhost:5173` | `https://yourdomain.com` |
| Redirect URLs | `http://localhost:5173/admin/reset-password` | `https://yourdomain.com/admin/reset-password` |

Add both localhost and production URLs to **Redirect URLs** list.

### 5.4 Create first admin user

1. **Authentication → Users → Add user** → email + password
2. Copy the user's **UUID**
3. **SQL Editor** → run:

```sql
INSERT INTO admin_users (id, email)
VALUES ('PASTE-USER-UUID-HERE', 'owner@example.com')
ON CONFLICT (id) DO NOTHING;
```

Without this row, login succeeds in Auth but the app rejects access ("You do not have admin access").

### 5.5 Email templates (optional)

**Authentication → Email Templates** — customize "Reset password" email branding if desired. Default works for recovery flow.

---

## 6. Database Migrations

All schema lives in `supabase/migrations/`. **Run in exact order:**

| Order | File | Purpose |
|-------|------|---------|
| 1 | `001_initial_schema.sql` | Tables, RLS, triggers, `generate_product_code()`, `is_admin()` |
| 2 | `002_seed_categories.sql` | Seed Sherwanis, Suits, Kurta-Safari categories |
| 3 | `003_fix_category_code_sequences.sql` | Fix RLS on category sequence trigger |
| 4 | `004_admin_category_rpc.sql` | `admin_create_category()` RPC + sequence policies |

### How to apply

**Option A — Supabase SQL Editor (recommended for manual rebuild):**

1. Open each file in order
2. Paste entire contents into **SQL Editor → New query**
3. Click **Run**
4. Confirm no errors before next file

**Option B — Supabase CLI:**

```bash
npm install -g supabase   # if not installed
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Option C — Category fix only (if 001–002 already ran but category save fails):**

Run `supabase/RUN_CATEGORY_FIX.sql` — equivalent to migrations 003 + 004 combined.

### What gets created

| Object | Description |
|--------|-------------|
| `categories` | Product collections with image config |
| `products` | Catalogue items with auto-generated codes |
| `product_images` | R2 references (max 4 per product) |
| `category_code_sequences` | Per-category code counters |
| `admin_users` | Links `auth.users` to admin role |
| `generate_product_code()` | Returns `JT-SHW-001` style codes |
| `admin_create_category()` | Secure category creation RPC |
| RLS policies | Public read active items; admin full CRUD |

Full schema reference: [`DATABASE.md`](./DATABASE.md)

---

## 7. Cloudflare — Full Setup

### 7.1 Account & login

```bash
cd workers/image-upload
npm install
npx wrangler login
```

Follow browser OAuth to authorize Wrangler.

### 7.2 Create R2 bucket

1. **Cloudflare Dashboard → R2 → Create bucket**
2. Name: **`junaid-textiles-media`** (must match `wrangler.toml`)
3. Location: Automatic or APAC if available

### 7.3 Enable public access

1. Open bucket **`junaid-textiles-media`**
2. **Settings → Public access → Allow Access** (or attach custom domain)
3. Copy the public URL, e.g. `https://pub-xxxx.r2.dev`
4. Update **both**:
   - `workers/image-upload/wrangler.toml` → `R2_PUBLIC_URL`
   - Project root `.env` → `VITE_R2_PUBLIC_URL`

> The public URL is **not** the dashboard browser URL. It is the `pub-*.r2.dev` link from bucket settings.

### 7.4 Configure Worker

Edit `workers/image-upload/wrangler.toml`:

```toml
name = "junaid-image-upload"
main = "src/index.ts"
compatibility_date = "2024-11-01"

[vars]
SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"
R2_PUBLIC_URL = "https://pub-xxxx.r2.dev"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "junaid-textiles-media"
```

### 7.5 Set Worker secret

```bash
cd workers/image-upload
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Paste service_role key when prompted
```

### 7.6 Deploy Worker

```bash
npm run deploy
```

Copy the output URL (e.g. `https://junaid-image-upload.your-subdomain.workers.dev`) into `.env`:

```env
VITE_UPLOAD_API_URL=https://junaid-image-upload.your-subdomain.workers.dev
```

### 7.7 Worker API endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/upload` | Bearer JWT + admin_users | Upload WEBP to R2 |
| `POST` | `/delete` | Bearer JWT + admin_users | Delete object from R2 |
| `OPTIONS` | `*` | — | CORS preflight |

Storage key pattern enforced by Worker:

```
products/{category-slug}/{product-uuid}/{image-uuid}.webp
```

Worker source: `workers/image-upload/src/index.ts`  
More detail: [`workers/image-upload/README.md`](../workers/image-upload/README.md)

### 7.8 R2 API token (optional — not used by Worker)

For backups or external tools only:

1. **R2 → Manage R2 API Tokens → Create**
2. Permissions: Object Read & Write on `junaid-textiles-media`
3. Store in password manager — **do not** put in Worker or frontend

---

## 8. Frontend Environment

Copy `.env.example` → `.env` in project root:

```env
# Supabase (from dashboard → Settings → API)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Must match Worker R2_PUBLIC_URL exactly
VITE_R2_PUBLIC_URL=https://pub-xxxx.r2.dev

# Worker URL from wrangler deploy (no trailing slash)
VITE_UPLOAD_API_URL=https://junaid-image-upload.your-subdomain.workers.dev

# Contact
VITE_WHATSAPP_NUMBER=918978678653

# Used for admin password-reset email links
VITE_SITE_URL=http://localhost:5173
```

### Variable sync rules

| Must match | Variables |
|------------|-----------|
| Same Supabase project | `VITE_SUPABASE_URL` = Worker `SUPABASE_URL` |
| Same R2 public base | `VITE_R2_PUBLIC_URL` = Worker `R2_PUBLIC_URL` |
| Deployed Worker | `VITE_UPLOAD_API_URL` = output of `wrangler deploy` |
| Production domain | `VITE_SITE_URL` = public site URL (for password reset) |

### Local development

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # TypeScript check
npm run build        # Production build
```

### Production deploy (Vercel example)

1. Connect Git repo to Vercel
2. Set all `VITE_*` env vars in Vercel project settings
3. Build command: `npm run build`
4. Output directory: `dist`
5. Update `VITE_SITE_URL` and Supabase redirect URLs to production domain

---

## 9. Admin Auth & Password Reset

### Routes

| Route | Purpose |
|-------|---------|
| `/admin/login` | Email + password sign in |
| `/admin/reset-password` | Set new password after email link |
| `/admin` | Dashboard (requires auth + `admin_users` row) |

### Session behavior

- Supabase session persists in browser localStorage until **Sign Out**
- Visiting **Owner Login** while already signed in → auto-redirects to `/admin`
- Session shared app-wide via `AuthProvider` (`src/hooks/useAuth.ts`)

### Forgot password flow

1. `/admin/login` → **Forgot password?**
2. Enter admin email → Supabase sends reset email
3. Email link opens `/admin/reset-password` with recovery token
4. Set new password → redirected to dashboard

**Requires:** Redirect URLs configured in Supabase (Section 5.3).

### Adding additional admins

1. Create user in Supabase Auth (or invite)
2. `INSERT INTO admin_users (id, email) VALUES ('uuid', 'email');`

---

## 10. Verification Checklist

After rebuild, confirm each item:

### Database

- [ ] `categories` table has 3 seed rows (or your custom categories)
- [ ] `SELECT * FROM admin_users` shows owner row
- [ ] `SELECT is_admin()` returns true when logged in as admin (SQL editor won't have JWT — test via app)

### Auth

- [ ] `/admin/login` — sign in works
- [ ] Wrong password shows clear error
- [ ] Already logged in → `/admin/login` redirects to `/admin`
- [ ] Forgot password email arrives and reset works

### Images

- [ ] Add product with image in admin — no "Failed to fetch"
- [ ] Image appears on public `/products/:code` page
- [ ] Image URL starts with `VITE_R2_PUBLIC_URL`
- [ ] Delete product removes images from R2 (check bucket)

### Public site

- [ ] `/collections/sherwanis` loads products (first 24, more on scroll)
- [ ] Scrolling loads additional products (infinite scroll)
- [ ] Product detail swipe gallery works on mobile
- [ ] Tap image or thumbnail opens fullscreen zoom lightbox
- [ ] Grid card image/name links to product page (no lightbox on grid)
- [ ] Mobile hamburger menu opens and links work
- [ ] Page scrolls to top when navigating between routes
- [ ] WhatsApp button opens with correct number
- [ ] Navbar text visible on catalogue pages
- [ ] Footer visible on home only (not on `/collections/*` or `/products/*`)

### Admin panel

- [ ] Create new category (Jodhpuri etc.) — no permission error
- [ ] Publish/unpublish product
- [ ] Mobile dashboard header — Sign Out visible

---

## 11. Backup & Data Recovery

### What to back up regularly

| Data | How |
|------|-----|
| **PostgreSQL** | Supabase → Database → Backups (Pro plan) or `pg_dump` |
| **R2 images** | R2 API token + `rclone` / AWS CLI sync to local or second bucket |
| **This repo** | Git remote (GitHub, Cursor, etc.) |
| **Secrets** | Password manager export |
| **`.env` values** | Password manager (not git) |

### If you lose R2 but keep Supabase

- Product rows and `product_images` metadata remain
- Image URLs will 404 until you restore R2 objects or re-upload images in admin

### If you lose Supabase but keep R2

- Re-run all migrations on new project
- Re-create admin user
- Product/image metadata is lost — you would need a custom script to re-link R2 keys or re-enter products manually

### If you lose everything except this repo

Follow **Section 4** from step 1. R2 images and database data are **not** in git — only schema and application code.

---

## 12. Related Documentation

| Document | Contents |
|----------|----------|
| [`CATALOGUE_BLUEPRINT.md`](./CATALOGUE_BLUEPRINT.md) | Reusable template for new clients (same logic, new brand) |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | System design, routes, layout rules |
| [`DATABASE.md`](./DATABASE.md) | Table schemas, RLS summary |
| [`ENVIRONMENT.md`](./ENVIRONMENT.md) | Env var quick reference |
| [`SECURITY.md`](./SECURITY.md) | Auth, RLS, upload security |
| [`IMAGE_PIPELINE.md`](./IMAGE_PIPELINE.md) | Crop, WEBP, R2 key format |
| [`ADMIN.md`](./ADMIN.md) | Admin panel usage |
| [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md) | Feature completion status |
| [`workers/image-upload/README.md`](../workers/image-upload/README.md) | Worker deploy details |

---

## Quick Reference — File Locations

```
.env.example                          # Frontend env template
supabase/migrations/001_*.sql         # Core schema
supabase/migrations/002_*.sql         # Seed categories
supabase/migrations/003_*.sql         # Category sequence RLS fix
supabase/migrations/004_*.sql         # admin_create_category RPC
supabase/RUN_CATEGORY_FIX.sql         # Combined 003+004 for SQL editor
workers/image-upload/wrangler.toml    # Worker + R2 config
workers/image-upload/.dev.vars.example # Local Worker secret template
src/lib/config.ts                     # Reads VITE_* env vars
src/hooks/useAuth.ts                  # AuthProvider + admin check
src/hooks/useProducts.ts              # useInfiniteProducts, CATALOGUE_PAGE_SIZE=24
src/lib/layout.ts                     # CATALOGUE_PAGE_CLASS
src/lib/routes.ts                     # Footer/chrome visibility rules
```

---

*Keep this file updated whenever project ref, bucket URL, Worker URL, or domain changes.*
