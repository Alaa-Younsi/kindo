import { useState } from "react";
import { cn } from "@/lib/utils";
import { responsiveSrcSet } from "@/lib/image";

type SmartImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "srcSet"> & {
  src: string;
  /** Rendered size hint for the browser's srcset picker. Match the real slot:
   *  exact px for fixed elements ("72px"), a breakpoint expr for fluid grids
   *  ("(max-width: 640px) 50vw, 240px"). Without it the browser assumes 100vw
   *  and pulls the largest candidate — defeating the whole srcset. */
  sizes?: string;
  /** LCP image: load eagerly + high priority, and skip the fade. */
  eager?: boolean;
  /** Blur-up opacity fade on load. Turn off when the element already owns a
   *  `transition-transform`/`transition-all` (two `transition-property`
   *  declarations on one element fight). Ignored when `eager`. */
  fade?: boolean;
};

/**
 * Drop-in <img> replacement: lazy + async by default, an optional blur-up
 * fade-in, a responsive srcset for Supabase Storage URLs, and self-healing —
 * if a srcset candidate 404s (render endpoint disabled for the project) it
 * drops the srcset once and re-renders against the real object URL so the
 * page never goes blank.
 */
export function SmartImage({
  src,
  sizes,
  eager = false,
  fade = true,
  className,
  alt = "",
  ...rest
}: SmartImageProps) {
  const [useSrcSet, setUseSrcSet] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const wantFade = fade && !eager;

  const srcSet = useSrcSet ? responsiveSrcSet(src) : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? (sizes ?? "100vw") : undefined}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (useSrcSet && responsiveSrcSet(src)) {
          setUseSrcSet(false);
          return;
        }
        setLoaded(true);
      }}
      className={cn(
        wantFade && "transition-opacity duration-300",
        wantFade && !loaded && "opacity-0",
        className,
      )}
      {...rest}
    />
  );
}
