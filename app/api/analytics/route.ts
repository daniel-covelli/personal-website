import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDayAnalytics } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

// Widest range one request may cover. The dashboard asks for single local days;
// the clamp just keeps an errant client from scanning the whole table.
const MAX_RANGE_MS = 32 * 24 * 60 * 60 * 1000;

// Hostnames that count as "our own site" for the traffic classifier —
// referrers from these are internal navigation, not acquisition.
function selfHosts(request: Request): string[] {
  const hosts = new Set<string>();
  const requestHost = request.headers.get('host');
  if (requestHost) hosts.add(requestHost.split(':')[0]);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    hosts.add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }
  try {
    if (process.env.NEXTAUTH_URL) {
      hosts.add(new URL(process.env.NEXTAUTH_URL).hostname);
    }
  } catch {
    // Malformed NEXTAUTH_URL — the other hosts cover it.
  }
  return Array.from(hosts);
}

// Admin-only: day analytics for [from, to). The client computes the range in
// its own timezone and sends UTC instants, so "a day" here is whatever the
// admin's browser says it is.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = new Date(searchParams.get('from') ?? '');
  const to = new Date(searchParams.get('to') ?? '');

  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    from >= to ||
    to.getTime() - from.getTime() > MAX_RANGE_MS
  ) {
    return NextResponse.json(
      { error: 'Invalid range: expected ?from=ISO&to=ISO within 32 days' },
      { status: 400 }
    );
  }

  try {
    const data = await getDayAnalytics(from, to, selfHosts(request));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics query error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
