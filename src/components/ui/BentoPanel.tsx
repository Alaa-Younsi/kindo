import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "brand" | "blue" | "green" | "yellow" | "none";

interface BentoPanelProps extends HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
  children: ReactNode;
}

const accentBorder: Record<Accent, string> = {
  brand: "border-brand/30 hover:border-brand",
  blue: "border-blue/30 hover:border-blue",
  green: "border-green/30 hover:border-green",
  yellow: "border-yellow/30 hover:border-yellow",
  none: "border-line",
};

export function BentoPanel({ accent = "none", className, children, ...props }: BentoPanelProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border-2 bg-panel p-6 shadow-sm transition-colors duration-200",
        accentBorder[accent],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
