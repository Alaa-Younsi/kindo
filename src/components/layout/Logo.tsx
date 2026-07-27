import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex shrink-0 items-center", className)} aria-label="KINDO">
      {/* The source is cropped to the mark (no empty margins), and scaled up
          via transform so the visible logo grows without changing the
          header's layout height. */}
      <img
        src="/logo.png"
        alt="KINDO"
        width={106}
        height={48}
        fetchPriority="high"
        className="h-11 w-auto origin-left scale-[1.15] object-contain sm:h-12"
      />
    </Link>
  );
}
