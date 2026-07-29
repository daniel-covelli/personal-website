'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DayAnalytics, Journey } from '@/lib/analytics';
import { CATEGORY_META } from '@/lib/traffic-sources';
import { Spinner } from '@/components/ui/spinner';
import TranscriptDialog from './TranscriptDialog';

interface AnalyticsDashboardProps {
  // Whether the Analytics tab is the active one. Data is fetched lazily on
  // first activation (all admin tab panels stay mounted).
  active: boolean;
}

// ---- Local-day helpers. The admin's browser timezone defines what "a day"
// is; the API just filters on the UTC instants we derive here. Date arithmetic
// (never +86400000ms) keeps DST transitions correct.

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(day: Date, n: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + n);
}

function dayKey(day: Date): string {
  const m = String(day.getMonth() + 1).padStart(2, '0');
  const d = String(day.getDate()).padStart(2, '0');
  return `${day.getFullYear()}-${m}-${d}`;
}

function isToday(day: Date): boolean {
  return dayKey(day) === dayKey(startOfToday());
}

function dayLabel(day: Date): string {
  return day.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function journeyLocation(j: Journey): string {
  return [j.city, j.region, j.country].filter(Boolean).join(', ');
}

// ---- Small presentational pieces (Ledger layout: one table row per visitor).

function SourcePill({ source }: { source: Journey['source'] }) {
  const meta = CATEGORY_META[source.category];
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.pillClass}`}
      title={meta.label}
    >
      {source.source}
    </span>
  );
}

function Trail({ journey }: { journey: Journey }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {journey.timeline.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-[10px] text-subtle">→</span>}
          {item.kind === 'pageview' ? (
            <span className="rounded bg-chip px-1.5 py-0.5 font-mono text-[11px] text-body">
              {item.path}
            </span>
          ) : (
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              ↓ Downloaded resume
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  aside,
  accent,
}: {
  label: string;
  value: number;
  aside?: string;
  accent?: boolean;
}) {
  return (
    <div className="px-4 py-3">
      <div className="text-[11px] text-subtle">{label}</div>
      <div
        className={`text-2xl font-semibold ${accent ? 'text-purple-700 dark:text-purple-300' : 'text-ink'}`}
      >
        {value}
        {aside && (
          <span className="ml-1.5 text-[11px] font-normal text-subtle">
            {aside}
          </span>
        )}
      </div>
    </div>
  );
}

function TopList({
  title,
  rows,
}: {
  title: string;
  rows: { key: React.ReactNode; count: number }[];
}) {
  return (
    <div className="rounded-lg border border-hair bg-panel shadow-sm">
      <div className="px-3 pb-1 pt-3 text-xs font-semibold text-body">
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="px-3 pb-3 text-xs text-subtle">—</p>
      ) : (
        <ul className="pb-2">
          {rows.map((row, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs"
            >
              <span className="min-w-0 truncate text-body">{row.key}</span>
              <span className="text-subtle [font-variant-numeric:tabular-nums]">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- The dashboard.

export default function AnalyticsDashboard({
  active,
}: AnalyticsDashboardProps) {
  const [day, setDay] = useState<Date>(startOfToday);
  const [data, setData] = useState<DayAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState<{
    id: string;
    context: string;
  } | null>(null);
  // Past days never change — cache them for the session. Today is always
  // refetched (it grows during the day), showing stale data while it refreshes.
  const cacheRef = useRef(new Map<string, DayAnalytics>());

  const load = useCallback(async (target: Date) => {
    const key = dayKey(target);
    const cached = cacheRef.current.get(key);
    if (cached) {
      setData(cached);
      setError('');
      if (!isToday(target)) return;
    } else {
      setData(null);
      setLoading(true);
    }
    try {
      const from = target.toISOString();
      const to = addDays(target, 1).toISOString();
      const res = await fetch(
        `/api/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as DayAnalytics;
      cacheRef.current.set(key, json);
      setData(json);
      setError('');
    } catch {
      setError('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void load(day);
  }, [active, day, load]);

  const onDateInput = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return;
    const picked = new Date(y, m - 1, d);
    setDay(picked > startOfToday() ? startOfToday() : picked);
  };

  const summary = data?.summary;

  return (
    <div className="mt-6">
      {/* Day picker */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => setDay((d) => addDays(d, -1))}
          className="h-8 w-8 rounded-lg border border-hair bg-panel text-sm text-body hover:bg-surface"
          aria-label="Previous day"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-ink">
          {dayLabel(day)}
        </span>
        <button
          onClick={() => setDay((d) => addDays(d, 1))}
          disabled={isToday(day)}
          className="h-8 w-8 rounded-lg border border-hair bg-panel text-sm text-body hover:bg-surface disabled:cursor-default disabled:text-subtle disabled:hover:bg-panel"
          aria-label="Next day"
        >
          →
        </button>
        <input
          type="date"
          value={dayKey(day)}
          max={dayKey(startOfToday())}
          onChange={(e) => onDateInput(e.target.value)}
          className="rounded-lg border border-hair bg-panel px-2 py-1 text-xs text-ink"
        />
        {!isToday(day) && (
          <button
            onClick={() => setDay(startOfToday())}
            className="px-1.5 py-1 text-xs text-brand hover:underline"
          >
            Today
          </button>
        )}
        {loading && <Spinner className="h-4 w-4 text-subtle" />}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}{' '}
          <button
            onClick={() => void load(day)}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {summary && (
        <>
          {/* Stat strip */}
          <section className="mt-4 rounded-lg border border-hair bg-panel shadow-sm">
            <div className="grid grid-cols-2 divide-x divide-hair sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Pageviews" value={summary.pageviews} />
              <Stat label="Visitors" value={summary.uniqueSessions} />
              <Stat label="LLM referrals" value={summary.llmSessions} accent />
              <Stat label="Resume downloads" value={summary.resumeDownloads} />
              <Stat
                label="Chats"
                value={summary.chatsEngaged}
                aside={
                  summary.chatsGreetingOnly > 0
                    ? `+${summary.chatsGreetingOnly} opened`
                    : undefined
                }
              />
              <Stat label="Likely bots" value={summary.botSessions} />
            </div>
          </section>

          {/* Journeys: one row per visitor */}
          <section className="mt-4 overflow-x-auto rounded-lg border border-hair bg-panel shadow-sm">
            {data.journeys.length === 0 ? (
              <p className="py-10 text-center text-sm text-subtle">
                No visits recorded on {dayLabel(day)}.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface text-[10px] uppercase tracking-wide text-subtle">
                    <th className="px-3 py-2 font-medium">Time</th>
                    <th className="px-3 py-2 font-medium">Visitor</th>
                    <th className="px-3 py-2 font-medium">Source</th>
                    <th className="px-3 py-2 font-medium">Journey</th>
                    <th className="px-3 py-2 font-medium">Chat</th>
                  </tr>
                </thead>
                <tbody>
                  {data.journeys.map((j) => {
                    const location =
                      journeyLocation(j) || 'Unknown location';
                    return (
                      <tr
                        key={j.sessionId}
                        className="border-b border-hair align-top last:border-b-0 hover:bg-surface"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-subtle [font-variant-numeric:tabular-nums]">
                          {fmtTime(j.firstSeenAt)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-[13px] font-medium text-ink">
                            {location}
                          </div>
                          <div className="text-[11px] text-subtle">
                            {j.device}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            <SourcePill source={j.source} />
                            {j.botLike && (
                              <span className="inline-flex whitespace-nowrap rounded-full bg-chip px-2 py-0.5 text-[10px] font-medium text-body">
                                Likely bot
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Trail journey={j} />
                        </td>
                        <td className="px-3 py-2.5">
                          {j.conversation &&
                            (j.conversation.engaged ? (
                              <button
                                onClick={() =>
                                  setTranscript({
                                    id: j.conversation!.id,
                                    context: `${location} · ${fmtTime(j.firstSeenAt)} · ${j.conversation!.messageCount} messages`,
                                  })
                                }
                                className="inline-flex whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/60"
                              >
                                Chatted · {j.conversation.messageCount} msgs
                              </button>
                            ) : (
                              <span className="inline-flex whitespace-nowrap rounded-full bg-chip px-2 py-0.5 text-[10px] font-medium text-subtle">
                                Opened chat
                              </span>
                            ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {/* Breakdowns */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TopList
              title="Top pages"
              rows={summary.topPages.map((r) => ({
                key: <span className="font-mono text-[11px]">{r.key}</span>,
                count: r.count,
              }))}
            />
            <TopList
              title="Sources (visitors)"
              rows={summary.topSources.map((r) => ({
                key: (
                  <span
                    className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_META[r.category].pillClass}`}
                  >
                    {r.source}
                  </span>
                ),
                count: r.count,
              }))}
            />
            <TopList
              title="Referrers (views)"
              rows={summary.topReferrers.map((r) => ({
                key: r.key,
                count: r.count,
              }))}
            />
            <TopList
              title="Locations (visitors)"
              rows={summary.topLocations.map((r) => ({
                key: r.key,
                count: r.count,
              }))}
            />
          </div>

          <p className="mt-4 text-[11px] text-subtle">
            Chat transcripts and chat stats are retained for 30 days. Pageviews
            and downloads are kept forever. Your own logged-in visits are never
            counted.
          </p>
        </>
      )}

      {!summary && !error && !loading && (
        <p className="mt-8 text-sm text-subtle">
          Open this tab to load analytics.
        </p>
      )}

      <TranscriptDialog
        conversationId={transcript?.id ?? null}
        context={transcript?.context ?? ''}
        onClose={() => setTranscript(null)}
      />
    </div>
  );
}
