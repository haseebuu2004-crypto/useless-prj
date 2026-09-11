/**
 * useDemoMode — detects whether the app is running in Competition Demo Mode
 * by checking for the ?demo=true URL query parameter.
 * 
 * Demo mode is purely additive and read-only with respect to URL params.
 * The normal tribunal at / is completely unaffected.
 */

import { useMemo } from "react";

export function useDemoMode(): boolean {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("demo") === "true";
  }, []);
}
