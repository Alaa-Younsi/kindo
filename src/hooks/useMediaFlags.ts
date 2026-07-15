import { useEffect, useState } from "react";

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

interface MediaFlags {
  isMobile: boolean;
  saveData: boolean;
  isSlowConnection: boolean;
  prefersReducedMotion: boolean;
  /** True when heavy decorative effects (hero art, animations) should be skipped. */
  shouldReduceEffects: boolean;
}

function readConnection(): NetworkInformation | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

function computeFlags(): MediaFlags {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  const connection = readConnection();
  const saveData = !!connection?.saveData;
  const isSlowConnection = connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g";
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return {
    isMobile,
    saveData,
    isSlowConnection,
    prefersReducedMotion,
    shouldReduceEffects: saveData || isSlowConnection || prefersReducedMotion,
  };
}

export function useMediaFlags(): MediaFlags {
  const [flags, setFlags] = useState<MediaFlags>(() =>
    typeof window === "undefined"
      ? {
          isMobile: false,
          saveData: false,
          isSlowConnection: false,
          prefersReducedMotion: false,
          shouldReduceEffects: false,
        }
      : computeFlags(),
  );

  useEffect(() => {
    const update = () => setFlags(computeFlags());
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    mobileQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);
    const connection = readConnection();
    connection?.addEventListener?.("change", update);

    return () => {
      mobileQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
      connection?.removeEventListener?.("change", update);
    };
  }, []);

  return flags;
}
