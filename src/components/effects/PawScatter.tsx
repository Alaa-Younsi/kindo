import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function Paw({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" aria-hidden className={className} style={style}>
      <ellipse cx="20" cy="26" rx="9" ry="7.5" />
      <ellipse cx="9" cy="15" rx="4" ry="5.4" />
      <ellipse cx="16" cy="10" rx="4" ry="5.4" />
      <ellipse cx="24" cy="10" rx="4" ry="5.4" />
      <ellipse cx="31" cy="15" rx="4" ry="5.4" />
    </svg>
  );
}

interface ScatterSpec {
  className: string;
  tilt: number;
  delay: number;
}

/* Fixed layout (not random) so light/dark and reruns render identically. */
const SCATTER: ScatterSpec[] = [
  { className: "start-[4%] top-[12%] h-8 w-8 text-brand/30", tilt: -24, delay: 0 },
  { className: "end-[8%] top-[8%] h-6 w-6 text-blue/30", tilt: 18, delay: 0.8 },
  { className: "start-[14%] bottom-[14%] h-7 w-7 text-green/30", tilt: 30, delay: 1.6 },
  { className: "end-[16%] bottom-[10%] h-9 w-9 text-yellow/40", tilt: -12, delay: 2.4 },
  { className: "start-[46%] top-[4%] h-5 w-5 text-brand/25", tilt: 8, delay: 1.2 },
  { className: "end-[38%] bottom-[4%] h-6 w-6 text-blue/25", tilt: -30, delay: 2.0 },
];

/**
 * Decorative floating paw prints for section backgrounds. Parent needs
 * `relative`; paws are absolutely positioned and never intercept clicks.
 */
export function PawScatter({ className, count = 6 }: { className?: string; count?: number }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {SCATTER.slice(0, count).map((paw, i) => (
        <Paw
          key={i}
          className={cn("absolute", paw.className)}
          style={
            {
              "--float-tilt": `${paw.tilt}deg`,
              animation: `kf-float ${5 + i * 0.7}s ease-in-out ${paw.delay}s infinite`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
