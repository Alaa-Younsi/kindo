// ---------------------------------------------------------------------------
// KINDO image pipeline — two independent halves, both required:
//
//   1. compressImage()  — shrinks what gets STORED. Runs in the admin upload
//      handlers before .upload(): downscale to a sane max edge + re-encode to
//      WebP. A raw phone photo is 3-6 MB; this brings it under ~150 KB.
//
//   2. responsiveSrcSet()/SmartImage — shrinks what gets SENT, and matters
//      far more for the Supabase egress + Vercel Cached Egress bill. Supabase
//      Storage's render endpoint resizes on the fly and negotiates WebP from
//      the Accept header, so a 350 px grid card pulls a 400 px file instead of
//      the full 1400 px original. Verified working on the free plan (the
//      "Image Transformations: unavailable in plan" dashboard tile is a
//      different billing line — curl the endpoint to confirm, don't trust it).
//
// SmartImage degrades safely: if the render endpoint is ever disabled for the
// project, its onError drops the srcset and re-renders against the real object
// URL, so images never go blank — they just stop saving bytes.
// ---------------------------------------------------------------------------

const MAX_EDGE = 1400;
const WEBP_QUALITY = 0.8;

/**
 * Downscale + re-encode an uploaded image to WebP before it ever reaches
 * Supabase Storage. Falls back to the original file on any failure (unusual
 * format, browser without createImageBitmap, an image that's already smaller).
 */
export async function compressImage(file: File): Promise<File> {
  // Non-raster uploads (SVG, GIF) — leave untouched.
  if (!/^image\/(jpe?g|png|webp|avif|bmp)$/i.test(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    return file;
  }
}

// --- Delivery-side responsive srcset ----------------------------------------

const SUPABASE_PUBLIC_MARKER = "/storage/v1/object/public/";
const SUPABASE_RENDER_MARKER = "/storage/v1/render/image/public/";
const STORAGE_SRCSET_WIDTHS = [160, 240, 360, 480, 640, 900, 1400] as const;
const STORAGE_QUALITY = 68;

export function isSupabaseStorageUrl(src: string | null | undefined): src is string {
  return !!src && src.includes(SUPABASE_PUBLIC_MARKER);
}

/**
 * Rewrite a public Storage object URL to the on-the-fly render endpoint at a
 * given width. `resize=contain` is NOT optional — width alone returns the
 * requested width at the ORIGINAL height (a silently squashed image that still
 * costs real bytes).
 */
export function supabaseRenderUrl(src: string, width: number): string {
  const base = src.replace(SUPABASE_PUBLIC_MARKER, SUPABASE_RENDER_MARKER);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}width=${width}&resize=contain&quality=${STORAGE_QUALITY}`;
}

/** srcset string for a Supabase Storage image, or undefined for any other host. */
export function supabaseSrcSet(src: string | null | undefined): string | undefined {
  if (!isSupabaseStorageUrl(src)) return undefined;
  return STORAGE_SRCSET_WIDTHS.map((w) => `${supabaseRenderUrl(src, w)} ${w}w`).join(", ");
}

/**
 * srcset for whichever host the image lives on. Today only Supabase Storage is
 * transformable; static `/images/*` bundle assets return undefined (they're
 * already hand-optimised and content-hashed).
 */
export function responsiveSrcSet(src: string | null | undefined): string | undefined {
  return supabaseSrcSet(src);
}
