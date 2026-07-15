import { motion, useScroll, useSpring } from "framer-motion";

/** Rainbow scroll-progress bar pinned to the top of the storefront. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-brand via-yellow to-green"
      style={{ scaleX }}
    />
  );
}
