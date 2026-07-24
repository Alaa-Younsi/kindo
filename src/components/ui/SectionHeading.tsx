import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tone = "brand" | "blue" | "green" | "yellow";

const KICKER_CLASSES: Record<Tone, string> = {
  brand: "bg-brand/10 text-brand border-brand/30",
  blue: "bg-blue/10 text-blue border-blue/30",
  green: "bg-green/10 text-green border-green/30",
  yellow: "bg-yellow/20 text-yellow border-yellow/50",
};

interface SectionHeadingProps {
  kicker: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  tone?: Tone;
  align?: "start" | "center";
  className?: string;
}

/**
 * Colorful section heading: tone pill kicker + squiggle-underlined title.
 * Reveal animates y-position only — opacity stays at 1 so a stalled
 * IntersectionObserver can never leave a heading invisible.
 */
export function SectionHeading({
  kicker,
  title,
  subtitle,
  tone = "brand",
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ y: 24 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(align === "center" ? "text-center" : "text-start", className)}
    >
      <span
        className={cn(
          "inline-block rounded-full border-2 px-4 py-1 text-xs font-extrabold uppercase tracking-widest",
          KICKER_CLASSES[tone],
        )}
      >
        {kicker}
      </span>
      <h2 className="mt-3 inline-block w-full font-display text-2xl font-extrabold text-ink sm:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="mx-auto mt-1 max-w-xl text-muted">{subtitle}</p>}
    </motion.div>
  );
}
