# Security

## Authentication

- **Admin access:** Supabase Auth (email + password)
- Admin users must exist in `admin_users` table (linked to `auth.users`)
- First admin: create user in Supabase Auth dashboard, then insert into `admin_users`

## Row Level Security (RLS)

RLS is **enabled** on all tables. Policies:

### Public (anon + authenticated)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| categories | Active only | — | — | — |
| products | Active only | — | — | — |
| product_images | Via active product | — | — | — |

### Admin (authenticated + in `admin_users`)

| Table | All operations |
|-------|----------------|
| categories | Full CRUD |
| products | Full CRUD |
| product_images | Full CRUD |
| category_code_sequences | Read; insert/update via migration 004 policies |
| admin_users | Read own row |

## R2 / Upload Security

**CRITICAL:** R2 secret credentials are **never** exposed in frontend code.

```
Admin Browser
    → processes image locally (Canvas)
    → POST to Cloudflare Worker with Supabase JWT
    → Worker verifies JWT + admin_users membership
    → Worker uploads to R2 via binding
    → Returns public URL
    → Admin saves metadata to Supabase
```

### Worker validates

1. `Authorization: Bearer <supabase_access_token>` present
2. Token is valid (Supabase `getUser`)
3. User ID exists in `admin_users`
4. File is WEBP, within size limits
5. Storage key matches expected pattern

## Environment Variables

| Variable | Exposure | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Public (frontend) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public (frontend) | Anon key (RLS protects data) |
| `VITE_R2_PUBLIC_URL` | Public | Public image CDN base URL |
| `VITE_UPLOAD_API_URL` | Public | Worker endpoint URL |
| `VITE_WHATSAPP_NUMBER` | Public | WhatsApp contact |
| `VITE_SITE_URL` | Public (frontend) | Password-reset redirect URL (also add to Supabase redirect URLs) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Worker only** | Admin verification |
| `R2_*` API token | **Not in Worker** | R2 binding on `junaid-textiles-media`; store token outside repo only |

## What Is NOT Exposed

- `R2_SECRET_ACCESS_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Raw infrastructure errors to end users

## Session Handling

- `AuthProvider` shares session across all pages (`src/hooks/useAuth.ts`)
- Supabase client manages session refresh in localStorage
- Already logged in → `/admin/login` redirects to `/admin`
- Admin UI redirects to `/admin/login` on session expiry
- Password reset via Supabase `resetPasswordForEmail` → `/admin/reset-password`
- Failed uploads show user-friendly messages, not stack traces

## Category Deletion Safety

Deleting/deactivating a category with products requires explicit admin choice:
1. Move products to another category (default/safest)
2. Archive/hide products
3. Permanently delete products (requires confirmation)
4. Cancel

Never silently cascade-delete products.
