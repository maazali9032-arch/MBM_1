# Database Schema

## Overview

PostgreSQL hosted on Supabase. All core product data is relational with explicit foreign keys. Image binaries are **not** stored in the database — only metadata and R2 references.

## Tables

### `categories`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `gen_random_uuid()` |
| name | TEXT NOT NULL | Display name |
| slug | TEXT UNIQUE NOT NULL | URL slug, e.g. `sherwanis` |
| description | TEXT | Short category description |
| image_url | TEXT | Optional category card image |
| code_prefix | TEXT NOT NULL | Product code prefix, e.g. `JT-SHW` |
| image_aspect_ratio | TEXT NOT NULL | e.g. `3:4` |
| image_width | INTEGER NOT NULL | Target output width (default 1200) |
| image_height | INTEGER NOT NULL | Target output height |
| crop_position | TEXT NOT NULL | `center`, `top`, `bottom` |
| display_order | INTEGER NOT NULL | Sort order |
| is_active | BOOLEAN NOT NULL | Hidden when false |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-updated via trigger |

### `products`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Stable product identity |
| category_id | UUID FK → categories | |
| product_code | TEXT UNIQUE NOT NULL | e.g. `JT-SHW-014` |
| name | TEXT | Optional; fallback generated |
| description | TEXT | Optional |
| is_active | BOOLEAN NOT NULL | Publish/unpublish |
| display_order | INTEGER NOT NULL | Sort within category |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `product_images`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| product_id | UUID FK → products ON DELETE CASCADE | |
| storage_key | TEXT NOT NULL | R2 object key |
| public_url | TEXT NOT NULL | Public CDN/bucket URL |
| alt_text | TEXT | Optional |
| display_order | INTEGER NOT NULL | 0 = primary (card image) |
| created_at | TIMESTAMPTZ | |

**Constraint:** Maximum 4 images per product enforced by trigger.

### `category_code_sequences`

| Column | Type | Notes |
|--------|------|-------|
| category_id | UUID PK FK → categories | |
| last_sequence | INTEGER NOT NULL | Atomic counter |

### `admin_users`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK FK → auth.users | |
| email | TEXT NOT NULL | |
| created_at | TIMESTAMPTZ | |

## Product Code Generation

Function `generate_product_code(category_id)`:
1. Locks the category's sequence row (`FOR UPDATE`)
2. Increments `last_sequence`
3. Returns `{prefix}-{NNN}` padded to 3 digits (e.g. `JT-SHW-014`)

Duplicate codes are prevented by UNIQUE constraint on `products.product_code`.

## Indexes

- `categories(slug)`, `categories(is_active, display_order)`
- `products(category_id)`, `products(product_code)`, `products(is_active)`
- `product_images(product_id, display_order)`
- `products` GIN index on `to_tsvector('english', coalesce(name,'') || ' ' || product_code)` — present in schema; the app’s `search_products()` RPC currently uses `ILIKE` (with frontend ilike fallback if RPC fails)

## RPC Functions

| Function | Purpose |
|----------|---------|
| `generate_product_code(category_id)` | Returns `{prefix}-{NNN}` e.g. `JT-SHW-014` |
| `search_products(p_query)` | Search active products by name, code, or category name |
| `admin_create_category(...)` | Secure category creation + sequence row (migration 004) |
| `is_admin()` | Used in RLS policies — checks `admin_users` |

## Seed Data

Three initial categories (configurable via admin later):

| Name | Slug | Prefix | Aspect Ratio |
|------|------|--------|--------------|
| Sherwanis & Wedding Wear | sherwanis | JT-SHW | 3:4 |
| Suits, Coat Pants & Jodhpuri | suits | JT-SUT | 3:4 |
| Kurta Pajama & Safari | kurta-safari | JT-KUR | 3:4 |

## Migrations

Located in `supabase/migrations/`. Apply **in order** via Supabase SQL editor or CLI:

| # | File |
|---|------|
| 1 | `001_initial_schema.sql` |
| 2 | `002_seed_categories.sql` |
| 3 | `003_fix_category_code_sequences.sql` |
| 4 | `004_admin_category_rpc.sql` |

Shortcut if category creation fails with permission error: run `supabase/RUN_CATEGORY_FIX.sql` (combines 003 + 004).

Full rebuild instructions: [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md)

```bash
supabase db push
# or run each migration file in order in the Supabase SQL editor
```
