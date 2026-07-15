// Generates public/sitemap.xml and public/robots.txt at build time.
// Product pages are dynamic (Supabase-sourced), so a hand-written sitemap
// goes stale immediately — this runs as a `prebuild` step on every deploy.
//
// Every static route below must exist in src/App.tsx's <Route> list, or the
// sitemap advertises a 404 to Google.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_URL = (process.env.VITE_SITE_URL || "https://kindo.dz").replace(/\/$/, "");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const STATIC_ROUTES = ["/", "/shop"];

async function fetchActiveProductSlugs() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      "[generate-sitemap] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — sitemap will only include static routes.",
    );
    return [];
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=slug&status=eq.active`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );
    if (!res.ok) {
      console.warn(`[generate-sitemap] Supabase query failed (${res.status}) — skipping product URLs.`);
      return [];
    }
    const rows = await res.json();
    return rows.map((row) => row.slug);
  } catch (err) {
    console.warn("[generate-sitemap] Failed to fetch products:", err.message);
    return [];
  }
}

function buildSitemapXml(urls) {
  const entries = urls
    .map(
      (url) => `  <url>
    <loc>${SITE_URL}${url}</loc>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function buildRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

const productSlugs = await fetchActiveProductSlugs();
const productUrls = productSlugs.map((slug) => `/product/${slug}`);
const allUrls = [...STATIC_ROUTES, ...productUrls];

writeFileSync(resolve("public/sitemap.xml"), buildSitemapXml(allUrls));
writeFileSync(resolve("public/robots.txt"), buildRobotsTxt());

console.log(`[generate-sitemap] Wrote sitemap.xml with ${allUrls.length} URLs (${productUrls.length} products).`);
