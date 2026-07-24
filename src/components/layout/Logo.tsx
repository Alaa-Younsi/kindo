import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex shrink-0 items-center", className)} aria-label="KINDO">
      <img
        src="/kindo-logo.png"
        alt="KINDO"
        className="h-11 w-auto rounded-xl object-contain sm:h-12"
      />
    </Link>
  );
}
