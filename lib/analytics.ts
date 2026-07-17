import { prisma } from './db';
import { classifyDevice } from './capture';
import {
  classifyTrafficSource,
  isLikelyBot,
  TrafficSource,
  TrafficCategory,
} from './traffic-sources';

// Admin dashboard read layer. Everything here is computed per-request from raw
// rows — a day of personal-site traffic is at most a few thousand rows, so
// plain findMany + in-memory grouping beats SQL aggregation for flexibility
// (the traffic-source classifier reclassifies history as its lists evolve).
// All shapes are JSON-serializable (dates as ISO strings): the client
// dashboard imports these types with `import type` only.

export interface CountRow {
  key: string;
  count: number;
}

export interface SourceCountRow {
  category: TrafficCategory;
  source: string;
  count: number;
}

export type TimelineItem =
  | { kind: 'pageview'; path: string; at: string }
  | { kind: 'resume_download'; at: string };

export interface JourneyConversation {
  id: string;
  // Lifetime of the conversation, not day-scoped: did the visitor ever type?
  engaged: boolean;
  messageCount: number;
  userMessageCount: number;
}

export interface Journey {
  sessionId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  timeline: TimelineItem[];
  country: string;
  region: string;
  city: string;
  device: string;
  botLike: boolean;
  // Classification of the session's first pageview in range (download-only
  // sessions have no referrer information and classify as Direct).
  source: TrafficSource;
  // null: never chatted, or the conversation was purged (30-day retention).
  conversation: JourneyConversation | null;
}

export interface DaySummary {
  pageviews: number;
  uniqueSessions: number;
  llmSessions: number;
  botSessions: number;
  resumeDownloads: number;
  // Day-scoped, by message timestamps: a conversation counts as engaged when
  // it has >=1 user-role message in range; greeting-only when it has messages
  // in range but none from the user (opened the widget, never typed).
  chatsEngaged: number;
  chatsGreetingOnly: number;
  topPages: CountRow[];
  topSources: SourceCountRow[]; // per session
  topReferrers: CountRow[]; // per pageview, external hostnames only
  topLocations: CountRow[]; // per session
}

export interface DayAnalytics {
  summary: DaySummary;
  journeys: Journey[];
}

const TOP_N = 10;

function top(counts: Map<string, number>): CountRow[] {
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, TOP_N);
}

function bump(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function referrerHostname(referrer: string): string {
  if (!referrer) return '';
  try {
    return new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export async function getDayAnalytics(
  from: Date,
  to: Date,
  selfHosts: string[]
): Promise<DayAnalytics> {
  const range = { gte: from, lt: to };
  const [pageViews, events] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: range },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.siteEvent.findMany({
      where: { createdAt: range },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const sessionIds = Array.from(
    new Set([
      ...pageViews.map((p) => p.sessionId),
      ...events.map((e) => e.sessionId),
    ])
  );

  // One query serves both needs: transcripts for the day's sessions (any age)
  // and day chat counters (message timestamps also catch a return visitor who
  // only reopened the chat and produced no pageviews).
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { sessionId: { in: sessionIds } },
        { messages: { some: { createdAt: range } } },
      ],
    },
    include: { messages: { select: { role: true, createdAt: true } } },
  });

  let chatsEngaged = 0;
  let chatsGreetingOnly = 0;
  for (const c of conversations) {
    const inRange = c.messages.filter(
      (m) => m.createdAt >= from && m.createdAt < to
    );
    if (inRange.length === 0) continue;
    if (inRange.some((m) => m.role === 'user')) chatsEngaged += 1;
    else chatsGreetingOnly += 1;
  }

  // Latest conversation per session (a session normally has one; "clear chat"
  // can historically produce more).
  const convBySession = new Map<string, (typeof conversations)[number]>();
  for (const c of conversations) {
    const existing = convBySession.get(c.sessionId);
    if (!existing || c.updatedAt > existing.updatedAt) {
      convBySession.set(c.sessionId, c);
    }
  }

  const viewsBySession = new Map<string, typeof pageViews>();
  for (const pv of pageViews) {
    const list = viewsBySession.get(pv.sessionId) ?? [];
    list.push(pv);
    viewsBySession.set(pv.sessionId, list);
  }
  const eventsBySession = new Map<string, typeof events>();
  for (const ev of events) {
    const list = eventsBySession.get(ev.sessionId) ?? [];
    list.push(ev);
    eventsBySession.set(ev.sessionId, list);
  }

  const journeys: Journey[] = sessionIds.map((sessionId) => {
    const views = viewsBySession.get(sessionId) ?? [];
    const sessionEvents = eventsBySession.get(sessionId) ?? [];
    const entryView = views[0];
    // Download-only sessions (direct /api/pdf hit) fall back to the event's
    // own country/user-agent so the journey still has geo and device.
    const entryEvent = sessionEvents[0];

    const timeline: (TimelineItem & { atDate: Date })[] = [
      ...views.map((v) => ({
        kind: 'pageview' as const,
        path: v.path,
        at: v.createdAt.toISOString(),
        atDate: v.createdAt,
      })),
      ...sessionEvents
        .filter((e) => e.type === 'resume_download')
        .map((e) => ({
          kind: 'resume_download' as const,
          at: e.createdAt.toISOString(),
          atDate: e.createdAt,
        })),
    ].sort((a, b) => a.atDate.getTime() - b.atDate.getTime());

    const userAgent = entryView?.userAgent ?? entryEvent?.userAgent ?? '';
    const conv = convBySession.get(sessionId);

    return {
      sessionId,
      firstSeenAt: timeline[0].at,
      lastSeenAt: timeline[timeline.length - 1].at,
      timeline: timeline.map((item): TimelineItem =>
        item.kind === 'pageview'
          ? { kind: item.kind, path: item.path, at: item.at }
          : { kind: item.kind, at: item.at }
      ),
      country: entryView?.country ?? entryEvent?.country ?? '',
      region: entryView?.region ?? '',
      city: entryView?.city ?? '',
      device: entryView?.device ?? classifyDevice(userAgent),
      botLike: isLikelyBot(userAgent),
      source: classifyTrafficSource({
        referrer: entryView?.referrer ?? '',
        utmSource: entryView?.utmSource ?? '',
        selfHosts,
      }),
      conversation: conv
        ? {
            id: conv.id,
            engaged: conv.messages.some((m) => m.role === 'user'),
            messageCount: conv.messages.length,
            userMessageCount: conv.messages.filter((m) => m.role === 'user')
              .length,
          }
        : null,
    };
  });

  journeys.sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt));

  const pageCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();
  for (const pv of pageViews) {
    bump(pageCounts, pv.path);
    const { category } = classifyTrafficSource({
      referrer: pv.referrer,
      utmSource: pv.utmSource,
      selfHosts,
    });
    if (category !== 'internal' && category !== 'direct') {
      const host = referrerHostname(pv.referrer);
      if (host) bump(referrerCounts, host);
    }
  }

  const sourceCounts = new Map<string, SourceCountRow>();
  const locationCounts = new Map<string, number>();
  for (const j of journeys) {
    const key = `${j.source.category}:${j.source.source}`;
    const existing = sourceCounts.get(key);
    if (existing) existing.count += 1;
    else sourceCounts.set(key, { ...j.source, count: 1 });

    const location = [j.city, j.region, j.country].filter(Boolean).join(', ');
    if (location) bump(locationCounts, location);
  }

  return {
    summary: {
      pageviews: pageViews.length,
      uniqueSessions: journeys.length,
      llmSessions: journeys.filter((j) => j.source.category === 'llm').length,
      botSessions: journeys.filter((j) => j.botLike).length,
      resumeDownloads: events.filter((e) => e.type === 'resume_download')
        .length,
      chatsEngaged,
      chatsGreetingOnly,
      topPages: top(pageCounts),
      topSources: Array.from(sourceCounts.values())
        .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source))
        .slice(0, TOP_N),
      topReferrers: top(referrerCounts),
      topLocations: top(locationCounts),
    },
    journeys,
  };
}
