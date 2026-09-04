import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useMediaFlags } from "@/hooks/useMediaFlags";
import { SmartImage } from "@/components/ui/SmartImage";
import { responsiveSrcSet } from "@/lib/image";

export interface GalleryImage {
  key: string;
  url: string;
  alt?: string | null;
}

interface GalleryProps {
  images: GalleryImage[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

const SWIPE_THRESHOLD = 60;

/**
 * Domain-agnostic product gallery: owns no state of its own, so a colour
 * swatch, a thumbnail click, and a swipe can all drive the same index from
 * the parent. Swipe direction is physical (left = next), matching standard
 * carousel convention regardless of text direction.
 */
export function Gallery({ images, activeIndex, onActiveChange }: GalleryProps) {
  const { prefersReducedMotion } = useMediaFlags();
  const image = images[activeIndex];

  const go = (delta: number) => {
    if (images.length < 2) return;
    onActiveChange((activeIndex + delta + images.length) % images.length);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x <= -SWIPE_THRESHOLD) go(1);
    else if (info.offset.x >= SWIPE_THRESHOLD) go(-1);
  };

  return (
    <div>
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-blue/25 via-yellow/25 to-brand/25"
        />
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-panel-2 shadow-xl">
          {image ? (
            <motion.div
              drag={images.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={handleDragEnd}
              style={{ touchAction: "pan-y" }}
              className="h-full w-full cursor-grab active:cursor-grabbing"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={image.key}
                  src={image.url}
                  srcSet={responsiveSrcSet(image.url)}
                  sizes="(max-width: 1024px) 100vw, 560px"
                  alt={image.alt ?? ""}
                  width={600}
                  height={600}
                  loading="eager"
                  fetchPriority="high"
                  draggable={false}
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="h-full w-full select-none object-cover"
                />
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-line">
              <ImageOff className="h-16 w-16" />
            </div>
          )}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-panel/80 p-2 text-ink shadow-lg backdrop-blur transition-transform hover:scale-110"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-panel/80 p-2 text-ink shadow-lg backdrop-blur transition-transform hover:scale-110"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-5 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.key}
              type="button"
              onClick={() => onActiveChange(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all hover:-translate-y-0.5 ${i === activeIndex ? "border-brand ring-2 ring-brand/30" : "border-line"}`}
            >
              <SmartImage
                src={img.url}
                alt=""
                width={64}
                height={64}
                fade={false}
                sizes="64px"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
