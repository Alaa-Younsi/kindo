import type { SVGProps } from "react";

/*
  KINDO animal mascots — hand-drawn animated SVG characters (the one case
  where hand-drawn SVG beats an icon library: bespoke brand motifs).
  Animated parts use the global kf-* keyframes from index.css; every
  animation is transform-only. `transformBox: "fill-box"` is required for
  transform-origin to resolve against the element, not the whole SVG.
*/

const part = (origin: string, animation: string): React.CSSProperties => ({
  transformBox: "fill-box",
  transformOrigin: origin,
  animation,
});

export function DogMascot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden {...props}>
      {/* tail */}
      <path
        d="M97 88 Q112 80 108 64"
        stroke="#C98A3B"
        strokeWidth="9"
        strokeLinecap="round"
        style={part("0% 100%", "kf-tailwag 0.9s ease-in-out infinite")}
      />
      {/* body */}
      <ellipse cx="60" cy="92" rx="34" ry="22" fill="#E3A85C" />
      {/* head */}
      <circle cx="60" cy="52" r="32" fill="#E3A85C" />
      {/* ears */}
      <path
        d="M32 34 Q22 52 34 66 Q40 52 44 40 Z"
        fill="#B77433"
        style={part("80% 10%", "kf-wiggle 2.6s ease-in-out infinite")}
      />
      <path
        d="M88 34 Q98 52 86 66 Q80 52 76 40 Z"
        fill="#B77433"
        style={part("20% 10%", "kf-wiggle 2.6s ease-in-out infinite reverse")}
      />
      {/* muzzle */}
      <ellipse cx="60" cy="64" rx="15" ry="11" fill="#F6E3C3" />
      <ellipse cx="60" cy="58" rx="6.5" ry="5" fill="#3A2A18" />
      {/* tongue */}
      <path
        d="M55 70 Q60 80 65 70 Z"
        fill="#E8342A"
        style={part("50% 0%", "kf-bounce-soft 1.4s ease-in-out infinite")}
      />
      {/* eyes */}
      <g style={part("center", "kf-blink 4.2s ease-in-out infinite")}>
        <circle cx="47" cy="46" r="4.5" fill="#2B1D10" />
        <circle cx="73" cy="46" r="4.5" fill="#2B1D10" />
        <circle cx="48.5" cy="44.5" r="1.5" fill="#fff" />
        <circle cx="74.5" cy="44.5" r="1.5" fill="#fff" />
      </g>
    </svg>
  );
}

export function CatMascot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden {...props}>
      {/* tail */}
      <path
        d="M92 96 Q112 92 106 72"
        stroke="#7B8794"
        strokeWidth="8"
        strokeLinecap="round"
        style={part("0% 100%", "kf-tailwag 1.6s ease-in-out infinite")}
      />
      {/* body */}
      <ellipse cx="58" cy="94" rx="32" ry="20" fill="#8E9AA8" />
      {/* ears */}
      <path
        d="M34 34 L40 12 L54 28 Z"
        fill="#8E9AA8"
        style={part("50% 90%", "kf-wiggle 3.2s ease-in-out infinite")}
      />
      <path d="M39 29 L42 18 L50 27 Z" fill="#F2A9B4" />
      <path
        d="M86 34 L80 12 L66 28 Z"
        fill="#8E9AA8"
        style={part("50% 90%", "kf-wiggle 3.2s ease-in-out infinite reverse")}
      />
      <path d="M81 29 L78 18 L70 27 Z" fill="#F2A9B4" />
      {/* head */}
      <circle cx="60" cy="52" r="30" fill="#8E9AA8" />
      {/* eyes */}
      <g style={part("center", "kf-blink 3.6s ease-in-out infinite")}>
        <ellipse cx="48" cy="48" rx="4.5" ry="5.5" fill="#1F2933" />
        <ellipse cx="72" cy="48" rx="4.5" ry="5.5" fill="#1F2933" />
        <circle cx="49.5" cy="46" r="1.5" fill="#fff" />
        <circle cx="73.5" cy="46" r="1.5" fill="#fff" />
      </g>
      {/* nose + mouth */}
      <path d="M56 60 L64 60 L60 65 Z" fill="#F2A9B4" />
      <path d="M60 65 Q56 71 51 68 M60 65 Q64 71 69 68" stroke="#1F2933" strokeWidth="1.8" strokeLinecap="round" />
      {/* whiskers */}
      <g stroke="#5B6470" strokeWidth="1.6" strokeLinecap="round">
        <path d="M40 56 L24 52" />
        <path d="M40 61 L25 62" />
        <path d="M80 56 L96 52" />
        <path d="M80 61 L95 62" />
      </g>
    </svg>
  );
}

export function BirdMascot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden {...props}>
      {/* body */}
      <ellipse cx="58" cy="66" rx="30" ry="34" fill="#FFC729" />
      {/* wing */}
      <path
        d="M50 62 Q22 66 30 88 Q46 88 56 78 Z"
        fill="#E8A800"
        style={part("90% 20%", "kf-flap 1.1s ease-in-out infinite")}
      />
      {/* head highlight */}
      <circle cx="66" cy="42" r="20" fill="#FFD34D" />
      {/* eye */}
      <g style={part("center", "kf-blink 3.8s ease-in-out infinite")}>
        <circle cx="72" cy="38" r="4.5" fill="#2B1D10" />
        <circle cx="73.5" cy="36.5" r="1.5" fill="#fff" />
      </g>
      {/* beak */}
      <path d="M84 42 L98 46 L84 52 Z" fill="#E8342A" />
      {/* tail feathers */}
      <path
        d="M32 84 Q16 92 12 106 M36 90 Q26 98 24 110"
        stroke="#E8A800"
        strokeWidth="6"
        strokeLinecap="round"
        style={part("100% 0%", "kf-wiggle 1.8s ease-in-out infinite")}
      />
      {/* feet */}
      <path d="M52 98 L52 108 M64 98 L64 108" stroke="#B77433" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function FishMascot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden {...props}>
      <g style={part("center", "kf-swim 2.6s ease-in-out infinite")}>
        {/* tail */}
        <path
          d="M86 60 Q106 42 104 34 Q88 40 82 52 M86 60 Q106 78 104 86 Q88 80 82 68"
          fill="#F0862D"
          stroke="#F0862D"
          strokeWidth="4"
          strokeLinejoin="round"
          style={part("0% 50%", "kf-tailwag 0.8s ease-in-out infinite")}
        />
        {/* body */}
        <ellipse cx="52" cy="60" rx="34" ry="24" fill="#FF9F3E" />
        <path d="M40 38 Q52 24 62 38 Q52 44 40 38 Z" fill="#F0862D" />
        {/* belly */}
        <path d="M26 68 Q52 84 78 66 Q54 78 26 68 Z" fill="#FFD9A8" />
        {/* eye */}
        <g style={part("center", "kf-blink 4.6s ease-in-out infinite")}>
          <circle cx="32" cy="54" r="5" fill="#2B1D10" />
          <circle cx="33.5" cy="52.5" r="1.6" fill="#fff" />
        </g>
        {/* mouth */}
        <path d="M20 62 Q24 66 28 63" stroke="#B7601A" strokeWidth="2" strokeLinecap="round" />
        {/* fin */}
        <path
          d="M50 62 Q42 74 54 78 Q58 70 56 62 Z"
          fill="#F0862D"
          style={part("50% 0%", "kf-wiggle 1.4s ease-in-out infinite")}
        />
      </g>
      {/* bubbles */}
      <circle cx="16" cy="44" r="3.5" fill="#1B6CEB" opacity="0.5" style={part("center", "kf-bubble 2.4s ease-out infinite")} />
      <circle cx="10" cy="52" r="2.4" fill="#1B6CEB" opacity="0.5" style={part("center", "kf-bubble 3.1s ease-out 0.8s infinite")} />
    </svg>
  );
}
