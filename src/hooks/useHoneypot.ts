import { useRef } from "react";

/**
 * Deters unsophisticated bots that auto-fill every form field (honeypot)
 * and scripted bots that submit near-instantly (min time-to-submit). This
 * only protects the HTML form — it does nothing against a bot calling the
 * place_order REST endpoint directly, which is why server-side validation
 * and per-phone rate limiting live in the RPC itself, not just here.
 */
export function useHoneypot() {
  const mountedAt = useRef(Date.now());
  const isSpam = (honeypotValue: string | undefined) =>
    !!honeypotValue || Date.now() - mountedAt.current < 1500;
  return { isSpam };
}
