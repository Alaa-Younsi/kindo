// Optimises the static images committed under public/ — the ones that never
// pass through the admin upload compressor (logo, favicon, OG image, hero,
// certificates, seed product photos). These are served straight off Vercel's
// CDN on almost every page view, so their weight is a permanent tax on the
// Cached Egress budget.
//
// Idempotent: an image already at or under its target is skipped. Safe to run
// repeatedly. Not wired into the build — run it by hand after adding assets:
//
//   bun run scripts/optimize-assets.mjs
//
// Uploaded product/category/review images are handled elsewhere:
//   - compressImage()  (src/lib/image.ts)      shrinks what's stored
//   - responsiveSrcSet + SmartImage            shrinks what's sent

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const PUBLIC = "public";

// path -> { maxWidth, format, quality }.  Anything not listed gets the default
// treatment for its directory (see resolveRule).
const RULES = {
  // `skipUnder`: leave PNGs alone once already this small — sharp's palette
  // requantisation shaves a few % every pass and isn't idempotent.
  "public/logo.png": { maxWidth: 480, format: "png", quality: 90, skipUnder: 40 * 1024 },
  "public/favicon.png": { maxWidth: 256, format: "png", quality: 90, skipUnder: 12 * 1024 },
  "public/og-image.png": { maxWidth: 1200, format: "png", quality: 82, skipUnder: 130 * 1024 }, // social crawlers want png/jpg, not webp
  "public/certificate1.jpeg": { maxWidth: 900, format: "webp", quality: 80, rename: "certificate1.webp" },
  "public/certificate2.png": { maxWidth: 900, format: "webp", quality: 80, rename: "certificate2.webp" },
  "public/bird.jpg": { maxWidth: 900, format: "webp", quality: 78, rename: "bird.webp" },
};

function resolveRule(relPath) {
  if (RULES[relPath]) return RULES[relPath];
  if (relPath.startsWith("public/images/products/")) return { maxWidth: 1000, format: "webp", quality: 74 };
  if (relPath.startsWith("public/images/")) return { maxWidth: 1400, format: "webp", quality: 78 };
  return null;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
let before = 0;
let after = 0;
let touched = 0;

for await (const path of walk(PUBLIC)) {
  if (!/\.(png|jpe?g|webp)$/i.test(path)) continue;
  const rule = resolveRule(path);
  if (!rule) continue;

  const input = await readFile(path);
  if (rule.skipUnder && input.length <= rule.skipUnder) {
    before += input.length;
    after += input.length;
    console.log(`  keep   ${path}  (${kb(input.length)}, under target)`);
    continue;
  }
  const meta = await sharp(input).metadata();

  let pipeline = sharp(input).rotate();
  if (meta.width && meta.width > rule.maxWidth) {
    pipeline = pipeline.resize({ width: rule.maxWidth, withoutEnlargement: true });
  }
  if (rule.format === "webp") pipeline = pipeline.webp({ quality: rule.quality, effort: 6 });
  else if (rule.format === "png") pipeline = pipeline.png({ quality: rule.quality, compressionLevel: 9, palette: true });
  else pipeline = pipeline.jpeg({ quality: rule.quality, mozjpeg: true });

  const out = await pipeline.toBuffer();
  const outPath = rule.rename ? path.replace(/[^/]+$/, rule.rename) : path;
  const sameFile = outPath === path;

  before += input.length;

  // Idempotency guard: re-encoding WebP/JPEG shaves a fraction every pass, so
  // only rewrite when the saving is worth it (>3%) or the extension changes.
  // A second run of this script is then a clean no-op.
  if (sameFile && out.length > input.length * 0.97) {
    after += input.length;
    console.log(`  keep   ${path}  (${kb(input.length)}, already optimal)`);
    continue;
  }

  await writeFile(outPath, out);
  after += out.length;
  touched++;
  const arrow = rule.rename ? `→ ${outPath.replace("public/", "")}` : "";
  console.log(`  write  ${path}  ${kb(input.length)} → ${kb(out.length)}  ${arrow}`);
}

console.log(
  `\n${touched} file(s) rewritten. Total ${kb(before)} → ${kb(after)} ` +
    `(−${(100 - (after / before) * 100).toFixed(0)}%).`,
);
if (Object.values(RULES).some((r) => r.rename)) {
  console.log("Renamed assets: update any hard-coded references (grep public/ paths in src/ and index.html).");
}

// Extra: emit a proper favicon set from the source logo mark.
try {
  const src = await readFile("public/favicon.png").catch(() => readFile("_brand/favicon-fullres.png"));
  await sharp(src).resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile("public/favicon-32.png");
  await sharp(src).resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile("public/apple-touch-icon.png");
  console.log("Wrote public/favicon-32.png (32×32) + public/apple-touch-icon.png (180×180).");
} catch (err) {
  console.warn("Favicon set not generated:", err.message);
}
