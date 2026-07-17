'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// The admin's own navigation is filtered here as a first line; the server
// (lib/capture.ts) is the authoritative guard.
const isExcluded = (path: string) =>
  path === '/login' || path === '/admin' || path.startsWith('/admin/');

// Module scope so state survives client-side navigations within one page load.
// prevPath feeds the synthetic internal referrer: document.referrer does NOT
// update on App Router pushState navigations, so without this every pageview
// in a session would repeat the original external referrer.
let prevPath: string | null = null;
// Guards React 18 StrictMode's dev double-effect (and any accidental rapid
// re-fire of the same path). Real back-and-forth navigation is slower than 1s.
let lastFire = { path: '', at: 0 };

// Invisible pageview reporter, mounted once in app/(main)/layout.tsx. Fires on
// initial load and every SPA navigation (usePathname change). RSC prefetches
// never run effects, so prefetched-but-unvisited pages are not counted.
export default function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (isExcluded(pathname)) {
      prevPath = pathname;
      return;
    }
    const now = Date.now();
    if (lastFire.path === pathname && now - lastFire.at < 1000) return;
    lastFire = { path: pathname, at: now };

    const referrer =
      prevPath === null
        ? document.referrer
        : window.location.origin + prevPath;
    prevPath = pathname;

    // window.location.search rather than useSearchParams(): the hook would
    // require a Suspense boundary around the layout in Next 14.
    const utmSource =
      new URLSearchParams(window.location.search).get('utm_source') ?? '';

    void fetch('/api/track', {
      method: 'POST',
      // keepalive lets the request survive an immediate navigation away;
      // same-origin credentials carry (and accept) the session cookie.
      keepalive: true,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer, utmSource }),
    }).catch(() => {
      // Analytics must never break the site.
    });
  }, [pathname]);

  return null;
}
