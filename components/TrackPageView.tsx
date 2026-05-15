"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Bridges Next.js App Router client-side navigations to GoatCounter.
// `count.js` auto-records one hit on initial load, but soft-navigations via
// `<Link>` don't trigger another load event — so we fire `count()` manually
// on every pathname change after the first render.
declare global {
  interface Window {
    goatcounter?: {
      count?: (opts?: { path?: string; title?: string }) => void;
    };
  }
}

export default function TrackPageView() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Defer one tick so Next.js's metadata update (document.title) lands
    // before GoatCounter snapshots it.
    const id = setTimeout(() => {
      window.goatcounter?.count?.();
    }, 0);
    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}
