import { motion } from "framer-motion";
import { Bird, Cat, Dog, Fish } from "lucide-react";
import { useMediaFlags } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/utils";

interface FloatingIconProps {
  Icon: typeof Dog;
  className: string;
  bg: string;
  delay: number;
  animate: boolean;
}

function FloatingIcon({ Icon, className, bg, delay, animate }: FloatingIconProps) {
  return (
    <motion.div
      className={cn(
        "absolute flex items-center justify-center rounded-3xl shadow-lg",
        bg,
        className,
      )}
      initial={{ y: 0, rotate: -6 }}
      animate={animate ? { y: [0, -14, 0], rotate: [-6, 4, -6] } : undefined}
      transition={{ duration: 5, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <Icon className="h-7 w-7 sm:h-9 sm:w-9" strokeWidth={2.25} />
    </motion.div>
  );
}

/**
 * Decorative hero centerpiece — four animal icons floating over a
 * paw-print-dotted colorful backdrop, echoing the KINDO logo's dog / cat /
 * bird / fish cast without relying on the photorealistic source banner.
 * Opacity stays at its CSS default of 1; only position/rotation animate,
 * so a stuck rAF frame under CPU pressure is "slightly offset," never
 * "invisible" (see animation-safety note).
 */
export function HeroPets() {
  const { shouldReduceEffects } = useMediaFlags();
  const animate = !shouldReduceEffects;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md sm:max-w-lg" aria-hidden>
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue/15 via-yellow/15 to-brand/15" />
      <div className="absolute inset-16 rounded-full border-4 border-dashed border-line" />

      <FloatingIcon
        Icon={Dog}
        bg="bg-brand text-brand-ink"
        className="start-2 top-6 h-16 w-16 sm:h-20 sm:w-20"
        delay={0}
        animate={animate}
      />
      <FloatingIcon
        Icon={Cat}
        bg="bg-blue text-blue-ink"
        className="end-2 top-16 h-14 w-14 sm:h-16 sm:w-16"
        delay={0.6}
        animate={animate}
      />
      <FloatingIcon
        Icon={Bird}
        bg="bg-yellow text-yellow-ink"
        className="start-10 bottom-8 h-14 w-14 sm:h-16 sm:w-16"
        delay={1.2}
        animate={animate}
      />
      <FloatingIcon
        Icon={Fish}
        bg="bg-green text-green-ink"
        className="end-8 bottom-2 h-16 w-16 sm:h-20 sm:w-20"
        delay={1.8}
        animate={animate}
      />
    </div>
  );
}
