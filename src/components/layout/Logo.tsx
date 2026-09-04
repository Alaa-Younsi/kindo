import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const SIZES = {
  // header: compact, scaled up via transform so it doesn't change the bar height
  sm: "h-11 origin-left scale-[1.15] sm:h-12",
  // admin sidebar / standalone: render at true size, no cramped transform
  lg: "h-20 sm:h-24",
} as const;

export function Logo({
  className,
  size = "sm",
}: {
  className?: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <Link to="/" className={cn("flex shrink-0 items-center", className)} aria-label="KINDO">
      {/* The source is cropped to the mark (no empty margins). */}
      <img
        src="/logo.png"
        alt="KINDO"
        width={212}
        height={96}
        fetchPriority="high"
        className={cn("w-auto object-contain", SIZES[size])}
      />
    </Link>
  );
}
