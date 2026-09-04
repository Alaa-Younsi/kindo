import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useActivePixels } from "@/hooks/useTrackingPixels";
import { configurePixels, matchedPixels, sendPageViewTo, setTrackingPath } from "@/lib/tracking";

/**
 * Bridges the DB pixel config into the runtime and sends SPA route-change
 * PageViews. Renders nothing. Mounted once inside <BrowserRouter>.
 *
 * - Skips /admin/* entirely — firing conversions while the owner clicks around
 *   their dashboard poisons every campaign's data with staff traffic.
 * - PageView bookkeeping is per (path, pixel id): a product route registers its
 *   match one render after mount, widening the matched set, so a plain
 *   "sent for this path" flag would miss the newly-matched pixels.
 */
export function TrackingBridge() {
  const { pathname } = useLocation();
  const { data: pixels } = useActivePixels();
  const sent = useRef<{ path: string; ids: Set<string> }>({ path: "", ids: new Set() });

  useEffect(() => {
    if (pixels) configurePixels(pixels);
  }, [pixels]);

  useEffect(() => {
    setTrackingPath(pathname);
    if (pathname.startsWith("/admin")) return;

    if (sent.current.path !== pathname) {
      sent.current = { path: pathname, ids: new Set() };
    }
    const fresh = matchedPixels()
      .filter((p) => !sent.current.ids.has(p.pixel_id))
      .map((p) => p.pixel_id);
    if (fresh.length === 0) return;
    fresh.forEach((id) => sent.current.ids.add(id));
    sendPageViewTo(fresh);
  }, [pathname, pixels]);

  return null;
}
