import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useMediaFlags } from "@/hooks/useMediaFlags";
import { useLanguage } from "@/i18n/LanguageProvider";
import { DogMascot, BirdMascot, CatMascot } from "./mascots";
import { Paw } from "./PawScatter";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * The hero photo as a 3D card the visitor can physically turn over.
 *
 * - Desktop: hold and drag left/right to flip; a click toggles; idle cursor
 *   movement gives a subtle parallax tilt.
 * - Phone: drag to flip, and the device's motion sensor tilts the card in 3D.
 *
 * The back reveals a friendly animal that pops in as the card turns. Fully
 * disabled (renders a plain image) under reduced-motion / save-data.
 */
export function HeroFlipCard({ src, alt }: { src: string; alt: string }) {
  const { t } = useLanguage();
  const { shouldReduceEffects, isMobile } = useMediaFlags();

  const rotateY = useMotionValue(0);
  const flip = useSpring(rotateY, { stiffness: 140, damping: 18, mass: 0.6 });

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const sTiltX = useSpring(tiltX, { stiffness: 120, damping: 20 });
  const sTiltY = useSpring(tiltY, { stiffness: 120, damping: 20 });

  const [hintGone, setHintGone] = useState(false);

  // The back animals scale + fade in only once the card is past its edge.
  const backScale = useTransform(flip, [90, 180], [0.65, 1]);
  const backOpacity = useTransform(flip, [95, 155], [0, 1]);
  const glareOpacity = useTransform(flip, [0, 90, 180], [0.05, 0.35, 0.05]);

  const drag = useRef({ active: false, startX: 0, startRot: 0, moved: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { active: true, startX: e.clientX, startRot: rotateY.get(), moved: 0 };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) {
      if (!isMobile) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        tiltY.set(px * 10);
        tiltX.set(-py * 10);
      }
      return;
    }
    const dx = e.clientX - drag.current.startX;
    drag.current.moved += Math.abs(dx);
    rotateY.set(clamp(drag.current.startRot + dx * 0.6, 0, 180));
  };

  const settle = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const cur = rotateY.get();
    if (drag.current.moved < 6) {
      rotateY.set(cur < 90 ? 180 : 0); // treat as a tap → toggle
    } else {
      rotateY.set(cur > 90 ? 180 : 0); // snap to nearest face
    }
    setHintGone(true);
  };

  const onPointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
    settle();
  };

  // Phone motion sensor → live 3D parallax.
  useEffect(() => {
    if (shouldReduceEffects || !isMobile) return;
    const handler = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0; // left / right tilt
      const beta = e.beta ?? 0; // front / back tilt
      tiltY.set(clamp(gamma * 0.6, -18, 18));
      tiltX.set(clamp((beta - 45) * 0.3, -14, 14));
    };
    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler, true);
  }, [shouldReduceEffects, isMobile, tiltX, tiltY]);

  if (shouldReduceEffects) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <img
          src={src}
          alt={alt}
          width={1600}
          height={893}
          loading="eager"
          fetchPriority="high"
          className="h-auto w-full"
        />
      </div>
    );
  }

  return (
    <div className="[perspective:1600px]" style={{ touchAction: "pan-y" }}>
      <motion.div style={{ rotateX: sTiltX, rotateY: sTiltY, transformStyle: "preserve-3d" }}>
        <motion.div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={settle}
          onPointerCancel={settle}
          onPointerLeave={onPointerLeave}
          style={{ rotateY: flip, transformStyle: "preserve-3d" }}
          className="relative cursor-grab select-none active:cursor-grabbing"
        >
          {/* FRONT — the hero photo */}
          <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-2xl [backface-visibility:hidden] [transform:translateZ(1px)]">
            <img
              src={src}
              alt={alt}
              width={1600}
              height={893}
              loading="eager"
              fetchPriority="high"
              draggable={false}
              className="h-auto w-full"
            />
            <motion.span
              aria-hidden
              style={{ opacity: glareOpacity }}
              className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/60 to-white/0"
            />
            {!hintGone && (
              <span className="pointer-events-none absolute bottom-3 end-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur">
                <Paw className="h-3.5 w-3.5" />
                {t("hero.flip.hint")}
              </span>
            )}
          </div>

          {/* BACK — the reveal */}
          <div className="bg-cta-gradient absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-[2rem] shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <BirdMascot className="anim-float absolute end-6 top-6 h-14 w-14 drop-shadow-lg" />
            <CatMascot className="absolute bottom-5 start-6 h-16 w-16 drop-shadow-lg" style={{ animation: "kf-bounce-soft 2.6s ease-in-out infinite" }} />
            <Paw className="absolute -bottom-6 -end-6 h-40 w-40 rotate-[-18deg] text-white/10" />
            <motion.div style={{ scale: backScale, opacity: backOpacity }}>
              <div className="anim-float">
                <DogMascot className="h-40 w-40 drop-shadow-2xl sm:h-52 sm:w-52" />
              </div>
            </motion.div>
            <motion.p
              style={{ opacity: backOpacity }}
              className="font-display px-8 text-center text-xl font-extrabold text-white drop-shadow sm:text-2xl"
            >
              {t("hero.flip.back")}
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
