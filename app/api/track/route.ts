import { prisma } from '@/lib/db';
import { getOrCreateSessionId } from '@/lib/session';
import { captureDecision, classifyDevice, geoFromRequest } from '@/lib/capture';

export const dynamic = 'force-dynamic';

// Paths that must never be recorded even if the client beacon misbehaves.
const EXCLUDED_PREFIXES = ['/admin', '/login', '/resume/print', '/resume/preview'];

const noContent = () => new Response(null, { status: 204 });

// Pageview beacon target (see components/AnalyticsBeacon.tsx). Fire-and-forget
// by contract: every exit path is a 204 — analytics must never surface an
// error to the site. Recording policy lives in lib/capture.ts.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      path?: unknown;
      referrer?: unknown;
      utmSource?: unknown;
    } | null;

    if (!body || typeof body.path !== 'string' || !body.path.startsWith('/')) {
      return noContent();
    }

    // Query/hash never belong in a stored path; utm_source is the only piece
    // of the query string we keep, and the beacon extracts it separately.
    const path = body.path.split('?')[0].split('#')[0].slice(0, 512);
    if (
      EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(p + '/')) ||
      path.startsWith('/api/')
    ) {
      return noContent();
    }

    const referrer =
      typeof body.referrer === 'string' ? body.referrer.slice(0, 768) : '';
    const utmSource =
      typeof body.utmSource === 'string' ? body.utmSource.slice(0, 120) : '';

    const decision = await captureDecision();
    if (!decision.record && !decision.dryRun) return noContent();

    const sessionId = await getOrCreateSessionId();
    const userAgent = (request.headers.get('user-agent') ?? '').slice(0, 400);
    const row = {
      sessionId,
      path,
      referrer,
      utmSource,
      ...geoFromRequest(request),
      device: classifyDevice(userAgent),
      userAgent,
    };

    if (decision.dryRun) {
      // Local/preview: exercise the whole pipeline minus the INSERT.
      console.log(
        `[track] (noop${decision.isAdmin ? ', would skip: admin session' : ''})`,
        row
      );
      return noContent();
    }

    await prisma.pageView.create({ data: row });
    return noContent();
  } catch (error) {
    console.error('Track error:', error);
    return noContent();
  }
}
