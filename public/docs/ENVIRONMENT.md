# Environment Variables

> **Full rebuild:** See [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md) for step-by-step Supabase + Cloudflare + env recreation.  
> **New client template:** See [`CATALOGUE_BLUEPRINT.md`](./CATALOGUE_BLUEPRINT.md).

## Overview

| Location | What goes there |
|----------|-----------------|
| Project root `.env` | Frontend (Vite) — public-safe keys only |
| `workers/image-upload/wrangler.toml` `[vars]` | Worker non-secrets |
| `wrangler secret put` | Worker secrets (encrypted in Cloudflare) |
| `workers/image-upload/.dev.vars` | Local Worker dev secrets only (gitignored) |
| **Not in repo** | R2 API token, Supabase `service_role` in frontend |

---

## Frontend (project root `.env`)

Copy `.env.example` to `.env`. Used by Vite at build/dev time.

```env
# Supabase — public anon key is safe with RLS enabled
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Must match Worker R2_PUBLIC_URL (public image base URL)
VITE_R2_PUBLIC_URL=https://your-public-r2-url.example.com

# Deployed Worker URL (no trailing slash)
VITE_UPLOAD_API_URL=https://junaid-image-upload.your-account.workers.dev

VITE_WHATSAPP_NUMBER=918978678653
VITE_SITE_URL=https://junaidtextiles.com
```

`VITE_SITE_URL` is used for admin password-reset email links. Must also be added to Supabase **Authentication → URL Configuration → Redirect URLs** as `{SITE_URL}/admin/reset-password`.

**Never in frontend `.env`:**

- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / R2 API token

---

## Cloudflare Worker

Bucket: **`junaid-textiles-media`**

See also: [`workers/image-upload/README.md`](../workers/image-upload/README.md)

### A. `wrangler.toml` → `[vars]` (non-secret)

Edit `workers/image-upload/wrangler.toml`:

```toml
[vars]
SUPABASE_URL = "https://your-project.supabase.co"
R2_PUBLIC_URL = "https://your-public-r2-url.example.com"
```

| Variable | Source | Notes |
|----------|--------|-------|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL | Same project as frontend |
| `R2_PUBLIC_URL` | R2 → `junaid-textiles-media` → Enable public access or custom domain | No trailing slash; used to build image URLs returned from `/upload` |

### B. Worker secret (one secret)

Set via CLI (prompts for value; never commit):

```bash
cd workers/image-upload
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

| Secret | Source |
|--------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (secret) |

Alternatively set in **Cloudflare Dashboard** → Workers → `junaid-image-upload` → Settings → Variables → Encrypt.

### C. R2 binding (not an environment variable)

In `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "junaid-textiles-media"
```

The Worker calls `env.BUCKET.put()` / `delete()` — Cloudflare attaches bucket access at deploy time. **No R2 API token in the Worker.**

### D. R2 User API token (you created this — do not put in Worker)

Object Read & Write token scoped to `junaid-textiles-media` is for **S3-compatible tools outside this Worker** (backups, external scripts). Store only in:

- Password manager, or
- Cloudflare dashboard (where it was created)

**Do not** add to `wrangler.toml`, `.dev.vars`, frontend `.env`, or git.

### E. Local Worker dev — `.dev.vars` (gitignored)

```bash
cp workers/image-upload/.dev.vars.example workers/image-upload/.dev.vars
```

Contents (local only):

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_URL` and `R2_PUBLIC_URL` come from `wrangler.toml` `[vars]` when running `wrangler dev`.

---

## Variable sync checklist

After deploy:

1. Worker `R2_PUBLIC_URL` = frontend `VITE_R2_PUBLIC_URL`
2. Frontend `VITE_UPLOAD_API_URL` = Worker URL from `wrangler deploy` output
3. Worker `SUPABASE_URL` = frontend `VITE_SUPABASE_URL` (same Supabase project)

---

## Supabase setup

1. Create Supabase project
2. Run migrations from `supabase/migrations/` **in order** (001 → 004)
3. Enable Email auth + set redirect URLs (see [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md) §9)
4. Create admin user in Auth
5. Insert into `admin_users`:
   ```sql
   INSERT INTO admin_users (id, email)
   VALUES ('user-uuid-from-auth', 'owner@email.com');
   ```

---

## R2 public access

1. Cloudflare dashboard → R2 → `junaid-textiles-media`
2. Enable **Public access** (r2.dev subdomain) or attach a **custom domain**
3. Copy that public base URL into:
   - `wrangler.toml` → `R2_PUBLIC_URL`
   - `.env` → `VITE_R2_PUBLIC_URL`

---

## Portability

When handing over to the client, update all of the above in their Cloudflare + Supabase accounts. No application code changes required.
