import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// `box` keeps the layout height the surrounding bars were built around;
// `img` is the visible mark inside it.
const SIZES = {
  // header: the 44/48px box sets the bar height — the mark grows within it
  sm: { box: "h-11 sm:h-12", img: "h-5 sm:h-6 lg:h-9" },
  // admin sidebar / standalone
  lg: { box: "h-20 sm:h-24", img: "h-8 sm:h-10" },
} as const;

export function Logo({
  className,
  size = "sm",
}: {
  className?: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <Link to="/" className={cn("flex shrink-0 items-center", SIZES[size].box, className)} aria-label="KINDO">
      {/* The source is cropped to the mark (no empty margins). */}
      <img
        src="/logo.png"
        alt="KINDO"
        width={469}
        height={203}
        fetchPriority="high"
        className={cn("w-auto object-contain", SIZES[size].img)}
      />
    </Link>
  );
}
