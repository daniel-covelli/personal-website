import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface CaptureDecision {
  // Insert the row. True only in production (or ANALYTICS_FORCE=1) with no
  // admin session.
  record: boolean;
  // Outside production without the escape hatch: callers console.log their
  // would-be row instead of inserting, so the pipeline is testable locally
  // with zero writes (local dev and previews share the PRODUCTION database).
  dryRun: boolean;
  // An authenticated session exists — this is the owner, never a visitor.
  // (Pre-login browsing by the owner is indistinguishable from a visitor.)
  isAdmin: boolean;
}

// Single gate for whether an analytics write (pageview or site event) should
// be recorded, shared by /api/track and /api/pdf so the policy can't drift.
export async function captureDecision(): Promise<CaptureDecision> {
  const live =
    process.env.VERCEL_ENV === 'production' ||
    process.env.ANALYTICS_FORCE === '1';
  const isAdmin = Boolean(await getServerSession(authOptions));
  return { record: live && !isAdmin, dryRun: !live, isAdmin };
}

// Vercel URL-encodes geo header values (e.g. "S%C3%A3o%20Paulo").
function decodeGeo(value: string | null): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value).slice(0, 64);
  } catch {
    return value.slice(0, 64);
  }
}

export function geoFromRequest(request: Request): {
  country: string;
  region: string;
  city: string;
} {
  return {
    country: decodeGeo(request.headers.get('x-vercel-ip-country')),
    region: decodeGeo(request.headers.get('x-vercel-ip-country-region')),
    city: decodeGeo(request.headers.get('x-vercel-ip-city')),
  };
}

// Coarse UA classification, done at write time (unlike traffic-source/bot
// classification, which is read-time) because the regexes are stable and it's
// what the dashboard groups by. Tablet must be checked before mobile: Android
// tablets lack "Mobile" in their UA, iPads say "iPad". Known limitation:
// iPadOS in desktop mode reports as macOS and lands in 'desktop'.
export function classifyDevice(ua: string): 'desktop' | 'mobile' | 'tablet' {
  if (/iPad|Tablet|Silk|PlayBook|Android(?!.*Mobile)/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile';
  return 'desktop';
}
