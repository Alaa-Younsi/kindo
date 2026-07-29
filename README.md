# KINDO — Animalerie en ligne

Cash-on-delivery e-commerce store for pet products (dogs, cats, birds, fish)
in Algeria, with a FR/AR (RTL) storefront, per-wilaya delivery pricing, and
a full admin dashboard. Bun + Vite + React + TypeScript + Supabase.

## Stack

- Vite + React 19 + TypeScript (strict)
- Tailwind CSS v4 (CSS-first `@theme`, `data-theme` light/dark tokens)
- React Router, TanStack Query, Zustand (cart), react-hook-form + zod
- Supabase (Postgres + Auth + Storage)
- Vercel (hosting + Edge Middleware for social link previews)

## Local setup

```bash
bun install
cp .env.example .env   # fill in Supabase URL/anon key once the project exists
bun run dev
```

## Project structure

```
src/
  components/   layout (Header/Footer/CartDrawer), product, ui primitives, effects
  hooks/        data hooks (React Query) + cross-cutting hooks
  i18n/         FR/AR translations + RTL-aware LanguageProvider
  lib/          supabase client, formatting, order-error mapping, pixel, image compression
  pages/        storefront pages + pages/admin (dashboard)
  store/        Zustand cart store
  theme/        light/dark ThemeProvider
  types/        DB row types
supabase/
  migrations/   sequential SQL migrations — run in order, never renumber
scripts/
  generate-sitemap.mjs   prebuild: writes public/sitemap.xml + public/robots.txt
  gen-og-image.ps1       one-off: regenerates public/og-image.png
middleware.ts   Vercel Edge — serves real OG tags to social-share crawlers on /product/:slug
vercel.json     SPA rewrite + security headers + asset caching
```

## Go-live checklist

1. **Create the Supabase project** → Project Settings → API → copy the URL
   and anon key into `.env` (never commit real keys).
2. **Run all SQL migrations in order** (every file in
   `supabase/migrations/`, `0001` → the highest-numbered one — never stop
   early) via the Supabase SQL editor or the CLI. This creates the schema,
   RLS policies, the `place_order`/`get_order_by_number` RPCs, the restock
   trigger, seed categories, seed delivery prices for all 69 wilayas (the 58
   original + the 11 added in the April 2026 reorganization), quantity
   offers / custom variants, and the `product-images`/`product-videos`
   storage buckets. Skipping the later migrations launches the store with
   only 58 wilayas and no offers/variants support.
3. **Create the admin user** in Supabase Auth (Authentication → Users →
   Add user, email/password). Nothing in `/admin` can be live-tested
   without this.
4. **Disable public sign-up** in Authentication → Settings. This is the
   actual thing standing between "only the admin has write access" and
   "anyone who finds the anon key can self-register into full admin
   access" — the `authenticated` RLS policies in `0002_rls.sql` grant full
   store-owner access to any authenticated session, there is no separate
   admin-role table in this scaffold.
5. **Seed real product photos, delivery prices per wilaya, and reviews**
   via the admin UI (`/admin`) — not manual SQL — to prove the CRUD forms
   work end-to-end.
6. **Confirm free shipping with the client.** Ships OFF by default
   (`store_settings.free_ship_threshold` is `NULL`). If wanted, set the
   number via SQL or a future admin field — the `place_order` RPC and both
   checkout UIs already key off it through `resolveShipping()`.
7. **Set environment variables in the Vercel project** (not just local
   `.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`.
   The link-preview Edge middleware reads the first two at the edge and
   silently falls back to the generic OG card without them. After deploy:
   ```bash
   curl -A "facebookexternalhit/1.1" https://<domain>/product/<slug>
   ```
   should return that product's own `og:title`/`og:image`.
8. **Videos**: Supabase Storage is fine for a couple of short compressed
   videos at modest traffic. Once real ad spend starts, move to
   Cloudinary/Bunny via the plain "paste a video URL" field already in the
   product form (no code change) — Supabase's free egress (~5 GB/month) is
   shared with every image and API call.
9. **Place at least one real test order end-to-end** through the actual
   browser (both the cart `Checkout` and a product page's `InlineCheckout`)
   as an anonymous customer — not logged into `/admin` — and confirm the
   order confirmation page shows the full recap. Label the test customer
   name `TEST` and delete it from the admin afterwards. Then fuzz
   `place_order` directly (`POST {url}/rest/v1/rpc/place_order` with
   `apikey`/`Authorization: Bearer <anon key>`): empty `items`, quantity
   0/negative/10000, a disabled wilaya, an invented wilaya string, an
   unknown product id, quantity greater than stock, a junk phone number, an
   empty name, and a 4th rapid order from the same phone — each should
   return a distinct `ERR_*`-prefixed error, never a 200 or a raw Postgres
   stack trace. Cancel one test order in the admin and confirm the
   product's stock goes back up (the restock trigger).
10. **Set the real Meta Pixel ID** in `index.html` — replace both
    `YOUR_PIXEL_ID` occurrences (the `<script>` init call and the
    `<noscript>` fallback `<img>`). The SPA-aware event wiring
    (`PageView` on route change, `ViewContent`, `AddToCart`,
    `InitiateCheckout`, `Purchase`) is already implemented in
    `src/lib/pixel.ts` and wired through the pages — only the ID itself
    needs to change.
11. **robots.txt / sitemap.xml** regenerate automatically on every
    `bun run build` (the `prebuild` script), sourced from `VITE_SITE_URL`
    and the live `products` table — don't hand-edit them.

## Deploying (Vercel + GitHub)

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create kindo --private --source=. --push   # or push to an existing remote
```

Then in Vercel: **Import Project** from the GitHub repo, framework preset
"Vite", and set the three `VITE_*` environment variables from `.env.example`
before the first deploy (step 7 above). `vercel.json` already handles the
SPA rewrite, security headers, and asset caching.

## Scripts

| Command             | Purpose                                      |
| -------------------- | --------------------------------------------- |
| `bun run dev`        | Start the Vite dev server                     |
| `bun run build`      | Typecheck, regenerate sitemap, production build |
| `bun run typecheck`  | `tsc --noEmit`                                |
| `bun run lint`       | ESLint, zero warnings                         |
| `bun run preview`    | Preview the production build locally          |
