import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "blue" | "green" | "yellow" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand/10 text-brand border-brand/30",
  blue: "bg-blue/10 text-blue border-blue/30",
  green: "bg-green/10 text-green border-green/30",
  yellow: "bg-yellow/15 text-yellow border-yellow/40",
  neutral: "bg-panel-2 text-muted border-line",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
