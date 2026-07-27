import type { CSSProperties, FC, SVGProps } from "react";
import { CatMascot, DogMascot, BirdMascot } from "./mascots";
import { useMediaFlags } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/utils";

type MascotComponent = FC<SVGProps<SVGSVGElement>>;

interface Wanderer {
  Comp: MascotComponent;
  size: string;
  position: string;
  /** Path keyframe: strolling animals walk back-and-forth, birds fly through. */
  path: "kf-stroll" | "kf-fly";
  /** Per-instance vertical bob layered on top of the path. */
  bob: string;
  duration: number;
  delay: number;
}

/* Fixed cast so light/dark and reruns render identically. Ordered by
   prominence — `count` slices from the front. */
const CAST: Wanderer[] = [
  { Comp: CatMascot, size: "h-16 w-16", position: "bottom-3", path: "kf-stroll", bob: "kf-bounce-soft 0.85s ease-in-out infinite", duration: 38, delay: 0 },
  { Comp: DogMascot, size: "h-20 w-20", position: "bottom-2", path: "kf-stroll", bob: "kf-bounce-soft 0.7s ease-in-out infinite", duration: 30, delay: 4 },
  { Comp: BirdMascot, size: "h-12 w-12", position: "top-10", path: "kf-fly", bob: "kf-float 3s ease-in-out infinite", duration: 24, delay: 2 },
  { Comp: CatMascot, size: "h-11 w-11", position: "bottom-28", path: "kf-stroll", bob: "kf-bounce-soft 1s ease-in-out infinite", duration: 52, delay: 9 },
  { Comp: BirdMascot, size: "h-9 w-9", position: "top-24", path: "kf-fly", bob: "kf-float 3.6s ease-in-out infinite", duration: 33, delay: 14 },
];

/**
 * Decorative animals that roam across a section — cats and a dog stroll along
 * the ground, birds glide overhead. The parent must be `relative` (the layer
 * clips itself). Purely transform-driven and fully skipped under save-data /
 * slow-network / reduced-motion.
 */
export function WanderingCats({ className, count = 3 }: { className?: string; count?: number }) {
  const { shouldReduceEffects, isMobile } = useMediaFlags();
  if (shouldReduceEffects) return null;

  const cast = CAST.slice(0, isMobile ? Math.min(2, count) : count);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {cast.map(({ Comp, size, position, path, bob, duration, delay }, i) => (
        <div
          key={i}
          className={cn("absolute left-0", position)}
          style={
            {
              animation: `${path} ${duration}s ${path === "kf-fly" ? "linear" : "ease-in-out"} ${delay}s infinite`,
              willChange: "transform",
            } as CSSProperties
          }
        >
          <div style={{ animation: bob }}>
            <Comp className={cn("drop-shadow-md", size)} />
          </div>
        </div>
      ))}
    </div>
  );
}
