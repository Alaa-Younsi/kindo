import { next } from "@vercel/edge";

export const config = {
  matcher: "/product/:slug*",
};

const CRAWLER_UA =
  /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|Discordbot|LinkedInBot|Slackbot|Pinterest|redditbot/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface ProductRow {
  name_fr: string;
  description_fr: string | null;
  price: number;
  stock: number;
  slug: string;
  product_images: { url: string }[];
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!CRAWLER_UA.test(userAgent)) {
    return next();
  }

  const url = new URL(request.url);
  const slug = url.pathname.split("/").pop();
  if (!slug) return next();

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const siteUrl = process.env.VITE_SITE_URL || "https://kindo.dz";

  if (!supabaseUrl || !supabaseAnonKey) {
    return next();
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/products?select=name_fr,description_fr,price,stock,slug,product_images(url)&slug=eq.${encodeURIComponent(slug)}&status=eq.active&limit=1`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      },
    );

    if (!res.ok) return next();

    const rows = (await res.json()) as ProductRow[];
    const product = rows[0];
    if (!product) return next();

    const title = escapeHtml(product.name_fr);
    const description = escapeHtml((product.description_fr ?? "").slice(0, 200));
    const image = escapeHtml(product.product_images?.[0]?.url ?? `${siteUrl}/og-image.png`);
    const pageUrl = escapeHtml(`${siteUrl}/product/${product.slug}`);
    const availability =
      product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

    const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>${title} | KINDO</title>
<meta property="og:type" content="product" />
<meta property="og:site_name" content="KINDO" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${pageUrl}" />
<meta property="og:image" content="${image}" />
<meta property="product:price:amount" content="${product.price}" />
<meta property="product:price:currency" content="DZD" />
<meta property="product:availability" content="${availability}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
<meta http-equiv="refresh" content="0;url=${pageUrl}" />
</head>
<body></body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return next();
  }
}
