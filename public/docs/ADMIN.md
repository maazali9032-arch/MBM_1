# Admin Panel

## Access

- URL: `/admin`
- Login: `/admin/login` (Supabase Auth email/password)
- Password reset: `/admin/login` → **Forgot password?** → email link → `/admin/reset-password`
- Session persists until **Sign Out** — returning via Owner Login auto-redirects to dashboard if still signed in
- First-time setup: create admin user in Supabase, add to `admin_users` table (see [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md))

## Dashboard Sections

| Section | Route | Capabilities |
|---------|-------|--------------|
| Dashboard | `/admin` | Overview, quick links |
| Products | `/admin/products` | List, filter, publish/unpublish, delete |
| Add Product | `/admin/products/new` | Create with images |
| Edit Product | `/admin/products/:id/edit` | Full edit |
| Categories | `/admin/categories` | CRUD, activate/deactivate, safe delete |

## Add Product Flow

**Important:** Add/Edit pages use `type="button"` handlers — **not** a wrapping `<form>` — to prevent accidental mobile keyboard submit and file-input issues.

1. Select **category** (required dropdown)
2. Product code auto-generated on save via `generate_product_code()`
3. Product **name** (optional — fallback from category + code)
4. **Description** (optional)
5. **Images** (1–4 required to publish):
   - **[ Upload from Device ]** — file picker (portaled to `document.body` for mobile Safari)
   - **[ Take Photo ]** — camera with category aspect-ratio frame overlay
6. Image management (`ImageManager`):
   - Interactive crop step before add
   - Preview, remove, drag reorder
   - **Star = featured image** (`display_order: 0` — used on catalogue cards)
7. Counter: `Images: X / 4`
8. **Publish toggle** — ON = visible on public website

### Validation

| Rule | Enforced by |
|------|-------------|
| Category required | Frontend |
| At least 1 image to publish | Frontend (`canPublish`) |
| Max 4 images | Frontend UI + DB trigger `enforce_max_product_images` |
| Unique product code | DB UNIQUE constraint |
| WEBP only in R2 | Image pipeline + Worker |

## Edit Product

- Change name, description, category
- Add / remove / reorder / replace images
- Publish / unpublish
- **Product codes are stable** — category change does not alter existing code

## Product List (`/admin/products`)

- Filter by name or product code
- Publish / unpublish (eye icon)
- Delete product (removes R2 images via Worker, then DB row)
- Link to edit

## Category Management

- Add categories: name, slug, description, code prefix, image crop config
- Edit name, slug, description, aspect ratio, dimensions
- Deactivate (hide from public)
- Delete with safety dialog when products exist:
  1. **Move** products to another category (default)
  2. **Archive** (hide products)
  3. **Permanently delete** products (requires confirmation)
  4. Cancel

## Mobile-First Design

- Touch-friendly buttons (min 44px tap targets on list actions)
- Camera capture on mobile browsers
- Responsive forms (`grid-cols-1 sm:grid-cols-2` on category form)
- Publish toggle stacks vertically on narrow screens
- File inputs portaled outside component tree (fixes iOS upload)
- No horizontal page overflow

## UI Language

Plain, non-technical labels for the shop owner:

- "Publish" / "Hide from website" (not `is_active`)
- "Add Product" (not "Create record")
- "Take Photo" / "Upload Images"
- "Show on public website" (publish toggle helper text)

## Related

- Image processing details: [`IMAGE_PIPELINE.md`](./IMAGE_PIPELINE.md)
- Auth & security: [`SECURITY.md`](./SECURITY.md)
