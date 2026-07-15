const MAX_EDGE = 1400;
const WEBP_QUALITY = 0.82;

/**
 * Downscale + re-encode an uploaded image to WebP before it ever reaches
 * Supabase Storage. Supabase has no free image transformation, so whatever
 * lands in the bucket is exactly what every shopper downloads — a raw phone
 * photo is 3-6 MB. Falls back to the original file on any failure (unusual
 * format, browser without OffscreenCanvas support, etc.).
 */
export async function compressImage(file: File): Promise<File> {
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

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!blob) return file;

    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    return file;
  }
}
