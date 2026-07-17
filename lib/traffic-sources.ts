// Read-time classification of stored analytics rows. Pure module, no imports:
// safe to use from both server queries (lib/analytics.ts) and client dashboard
// components. PageView rows store RAW referrer/utm_source/user_agent, so
// growing the lists below retroactively reclassifies all history for free.

export type TrafficCategory =
  | 'llm'
  | 'search'
  | 'social'
  | 'referral'
  | 'internal'
  | 'direct';

export interface TrafficSource {
  category: TrafficCategory;
  // Display label: 'ChatGPT', 'Google', 'Hacker News', a bare hostname for
  // unrecognized referrals, 'Direct', 'Internal'.
  source: string;
}

interface SourceEntry {
  label: string;
  hosts: string[];
  // utm_source values that identify this source even with no referrer
  // (e.g. ChatGPT appends utm_source=chatgpt.com; native apps send no referrer).
  utm?: string[];
}

const LLM_SOURCES: SourceEntry[] = [
  {
    label: 'ChatGPT',
    hosts: ['chatgpt.com', 'chat.openai.com'],
    utm: ['chatgpt.com', 'chatgpt', 'openai'],
  },
  { label: 'Claude', hosts: ['claude.ai'], utm: ['claude.ai', 'claude'] },
  {
    label: 'Perplexity',
    hosts: ['perplexity.ai', 'pplx.ai'],
    utm: ['perplexity', 'perplexity.ai'],
  },
  {
    label: 'Gemini',
    hosts: ['gemini.google.com', 'bard.google.com', 'aistudio.google.com'],
    utm: ['gemini'],
  },
  { label: 'Copilot', hosts: ['copilot.microsoft.com'], utm: ['copilot'] },
  { label: 'Grok', hosts: ['grok.com', 'x.ai'], utm: ['grok'] },
  { label: 'Meta AI', hosts: ['meta.ai'] },
  { label: 'Poe', hosts: ['poe.com'] },
  { label: 'DeepSeek', hosts: ['deepseek.com', 'chat.deepseek.com'] },
  { label: 'Mistral', hosts: ['chat.mistral.ai', 'mistral.ai'] },
  { label: 'You.com', hosts: ['you.com'] },
  { label: 'Phind', hosts: ['phind.com'] },
  { label: 'Kimi', hosts: ['kimi.com', 'kimi.moonshot.cn'] },
  { label: 'Qwen', hosts: ['chat.qwen.ai'] },
];

const SEARCH_SOURCES: SourceEntry[] = [
  { label: 'Bing', hosts: ['bing.com'] },
  { label: 'DuckDuckGo', hosts: ['duckduckgo.com'] },
  { label: 'Brave Search', hosts: ['search.brave.com'] },
  { label: 'Ecosia', hosts: ['ecosia.org'] },
  { label: 'Kagi', hosts: ['kagi.com'] },
  { label: 'Startpage', hosts: ['startpage.com'] },
  { label: 'Yandex', hosts: ['yandex.com', 'yandex.ru'] },
  { label: 'Baidu', hosts: ['baidu.com'] },
  { label: 'Qwant', hosts: ['qwant.com'] },
  { label: 'Yahoo', hosts: ['search.yahoo.com'] },
];

// Any google.<tld> that wasn't already claimed by the LLM list
// (gemini.google.com is checked before this ever runs).
const GOOGLE_HOST = /(^|\.)google\.[a-z.]+$/;

const SOCIAL_SOURCES: SourceEntry[] = [
  { label: 'X', hosts: ['x.com', 'twitter.com', 't.co'] },
  { label: 'LinkedIn', hosts: ['linkedin.com', 'lnkd.in'] },
  { label: 'Facebook', hosts: ['facebook.com', 'fb.me'] },
  { label: 'Instagram', hosts: ['instagram.com'] },
  { label: 'Threads', hosts: ['threads.net'] },
  { label: 'Reddit', hosts: ['reddit.com'] },
  { label: 'Hacker News', hosts: ['news.ycombinator.com'] },
  { label: 'Bluesky', hosts: ['bsky.app'] },
  { label: 'Mastodon', hosts: ['mastodon.social'] },
  { label: 'TikTok', hosts: ['tiktok.com'] },
  { label: 'YouTube', hosts: ['youtube.com', 'youtu.be'] },
];

// Suffix match so subdomains count: l.facebook.com matches facebook.com.
function hostMatches(hostname: string, entry: string): boolean {
  return hostname === entry || hostname.endsWith('.' + entry);
}

function findByHost(
  sources: SourceEntry[],
  hostname: string
): SourceEntry | undefined {
  return sources.find((s) => s.hosts.some((h) => hostMatches(hostname, h)));
}

function referrerHostname(referrer: string): string {
  if (!referrer) return '';
  try {
    return new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function classifyTrafficSource(input: {
  referrer: string;
  utmSource: string;
  // Hostnames considered "our own site"; a matching referrer means an internal
  // navigation, not an acquisition source.
  selfHosts: string[];
}): TrafficSource {
  const hostname = referrerHostname(input.referrer);
  const utm = input.utmSource.trim().toLowerCase();

  // LLM utm tokens outrank everything: ChatGPT's native apps send no referrer,
  // only utm_source=chatgpt.com.
  if (utm) {
    const byUtm = LLM_SOURCES.find((s) => s.utm?.includes(utm));
    if (byUtm) return { category: 'llm', source: byUtm.label };
  }

  if (hostname) {
    const llm = findByHost(LLM_SOURCES, hostname);
    if (llm) return { category: 'llm', source: llm.label };

    const search = findByHost(SEARCH_SOURCES, hostname);
    if (search) return { category: 'search', source: search.label };
    if (GOOGLE_HOST.test(hostname)) {
      return { category: 'search', source: 'Google' };
    }

    const social = findByHost(SOCIAL_SOURCES, hostname);
    if (social) return { category: 'social', source: social.label };

    if (input.selfHosts.some((h) => hostMatches(hostname, h.toLowerCase()))) {
      return { category: 'internal', source: 'Internal' };
    }

    return { category: 'referral', source: hostname };
  }

  // No referrer but a utm_source we don't recognize — still a tagged link.
  if (utm) return { category: 'referral', source: utm };

  return { category: 'direct', source: 'Direct' };
}

// JS-running bots that fire the beacon anyway (headless browsers, some AI
// browsing agents). Non-JS crawlers (GPTBot etc.) never reach /api/track, but
// they can hit /api/pdf directly, so the tokens still matter for site_events.
const BOT_UA =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|prerender|puppeteer|playwright|phantomjs|selenium|python-requests|python-httpx|go-http-client|wget|curl|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|claude-user|perplexitybot|bingpreview|facebookexternalhit|vercel-screenshot|checkly/i;

export function isLikelyBot(userAgent: string): boolean {
  if (!userAgent) return true;
  return BOT_UA.test(userAgent);
}

// Dashboard styling per category (admin palette).
export const CATEGORY_META: Record<
  TrafficCategory,
  { label: string; pillClass: string }
> = {
  llm: {
    label: 'LLM',
    pillClass: 'bg-purple-100 text-purple-700',
  },
  search: {
    label: 'Search',
    pillClass: 'bg-blue-100 text-blue-700',
  },
  social: {
    label: 'Social',
    pillClass: 'bg-sky-100 text-sky-700',
  },
  referral: {
    label: 'Referral',
    pillClass: 'bg-amber-100 text-amber-700',
  },
  internal: {
    label: 'Internal',
    pillClass: 'bg-gray-100 text-gray-600',
  },
  direct: {
    label: 'Direct',
    pillClass: 'bg-green-100 text-green-700',
  },
};
