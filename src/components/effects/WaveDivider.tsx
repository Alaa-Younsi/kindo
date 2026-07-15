import { cn } from "@/lib/utils";

/**
 * Wavy section divider. `className` sets the fill via text color
 * (e.g. "text-panel-2") — the wave takes the color of the section it
 * introduces, drawn over the section above it.
 */
export function WaveDivider({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <div className={cn("-mb-px w-full overflow-hidden leading-none", flip && "rotate-180", className)} aria-hidden>
      <svg
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        className="block h-8 w-full fill-current sm:h-12"
      >
        <path d="M0 40 C 180 8 320 64 520 42 C 720 20 860 58 1060 44 C 1240 32 1360 12 1440 28 L1440 64 L0 64 Z" />
      </svg>
    </div>
  );
}
