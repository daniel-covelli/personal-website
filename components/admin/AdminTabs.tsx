'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ResumeContent, Article } from '@/lib/types';
import {
  SYSTEM_PROMPT_VARIABLES,
  GREETING_PROMPT_VARIABLES,
} from '@/lib/chat-template';
import ContentEditor from './ContentEditor';
import ChatConfigEditor from './ChatConfigEditor';
import ArticlesEditor from './ArticlesEditor';
import AssetsManager from './AssetsManager';
import PromptEditor from './PromptEditor';
import AnalyticsDashboard from './AnalyticsDashboard';

interface AdminTabsProps {
  // Tab resolved server-side from the /admin/[[...tab]] URL segment.
  initialTab: TabId;
  content: ResumeContent;
  chatModels: string[];
  articles: Article[];
  // In-effect templates + their server-rendered first paint for each editor's
  // live preview (computed server-side in page.tsx; the editors re-render edits
  // via /api/chat-config).
  systemPrompt: string;
  defaultSystemPrompt: string;
  initialRenderedSystemPrompt: string;
  greetingPrompt: string;
  defaultGreetingPrompt: string;
  initialRenderedGreeting: string;
}

const TABS = [
  { id: 'resume', label: 'Resume' },
  { id: 'writing', label: 'Writing' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'assets', label: 'Assets' },
  { id: 'config', label: 'Config' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export function isTabId(value: string): value is TabId {
  return TABS.some((t) => t.id === value);
}

export default function AdminTabs({
  initialTab,
  content,
  chatModels,
  articles,
  systemPrompt,
  defaultSystemPrompt,
  initialRenderedSystemPrompt,
  greetingPrompt,
  defaultGreetingPrompt,
  initialRenderedGreeting,
}: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const pathname = usePathname();

  // Companies from the resume become the "cards under …" placement targets for
  // articles (see the Writing tab's Home placement dropdown).
  const companies = Array.from(
    new Set(content.experience.map((e) => e.company).filter(Boolean))
  );

  // Best-effort "is this asset used?" haystack for the Assets tab: every
  // article's header URL + Markdown body concatenated. Built from the
  // server-loaded articles, so edits made in the Writing tab this session
  // aren't reflected until reload — the Assets delete confirm is the real guard.
  const articleText = useMemo(
    () => articles.map((a) => `${a.headerImageUrl}\n${a.body}`).join('\n'),
    [articles]
  );

  // Tab switches update the URL via history.pushState (Next syncs usePathname)
  // instead of router navigation, so every tab stays mounted and unsaved edits
  // survive. This effect is the reverse direction: back/forward (or any router
  // navigation to another /admin/<tab> URL) re-syncs the active tab.
  useEffect(() => {
    const segment = pathname.split('/')[2] ?? '';
    if (isTabId(segment)) {
      setActiveTab(segment);
    } else if (pathname === '/admin') {
      setActiveTab('resume');
    }
  }, [pathname]);

  // Legacy #tab hash support (old /admin#writing links and bookmarks): upgrade
  // the hash to its canonical route after mount.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (isTabId(hash)) {
      setActiveTab(hash);
      window.history.replaceState(null, '', `/admin/${hash}`);
    }
  }, []);

  const selectTab = (id: TabId) => {
    setActiveTab(id);
    window.history.pushState(null, '', `/admin/${id}`);
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Admin sections"
        className="mb-4 flex gap-1 border-b border-hair"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(tab.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-brand text-brand'
                  : 'border-transparent text-subtle hover:border-rail hover:text-body'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Every tab stays mounted so unsaved edits survive tab switches; the
          inactive ones are hidden rather than unmounted. */}
      <div className={activeTab === 'resume' ? '' : 'hidden'}>
        <ContentEditor initialContent={content} />
      </div>
      <div className={activeTab === 'writing' ? '' : 'hidden'}>
        <ArticlesEditor initialArticles={articles} companies={companies} />
      </div>
      <div className={activeTab === 'analytics' ? '' : 'hidden'}>
        <AnalyticsDashboard active={activeTab === 'analytics'} />
      </div>
      <div className={activeTab === 'assets' ? '' : 'hidden'}>
        <AssetsManager
          active={activeTab === 'assets'}
          articleText={articleText}
        />
      </div>
      <div className={activeTab === 'config' ? '' : 'hidden'}>
        <ChatConfigEditor initialModels={chatModels} />
        <PromptEditor
          title="System Prompt"
          description={
            <>
              Controls how the chat assistant behaves. This is a{' '}
              <a
                href="https://liquidjs.com/tutorials/intro-to-liquid.html"
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:underline"
              >
                Liquid
              </a>{' '}
              template — your resume is injected as variables when the assistant
              runs, so it always reflects the latest Resume tab content. Drop in{' '}
              <code className="rounded bg-chip px-1 py-0.5 font-mono text-xs">
                {'{{ resume }}'}
              </code>{' '}
              for the whole resume, or loop over the individual sections.
            </>
          }
          field="systemPrompt"
          initialPrompt={systemPrompt}
          defaultPrompt={defaultSystemPrompt}
          initialRenderedPrompt={initialRenderedSystemPrompt}
          variables={SYSTEM_PROMPT_VARIABLES}
          warnMissingResume
          previewDescription="The template above rendered against your current resume content — exactly what the assistant would receive. Updates as you edit."
          saveLabel="Save System Prompt"
        />
        <PromptEditor
          title="Opening Message"
          description={
            <>
              The instruction used to generate the chat&rsquo;s first message.
              Also a Liquid template — the assistant&rsquo;s voice comes from
              the System Prompt above; this just steers what the opening line
              says. Reference{' '}
              <code className="rounded bg-chip px-1 py-0.5 font-mono text-xs">
                {'{{ name }}'}
              </code>{' '}
              and other variables as needed.
            </>
          }
          field="greetingPrompt"
          initialPrompt={greetingPrompt}
          defaultPrompt={defaultGreetingPrompt}
          initialRenderedPrompt={initialRenderedGreeting}
          variables={GREETING_PROMPT_VARIABLES}
          rows={5}
          previewDescription="The instruction the model receives to write the opening message (variables filled in). The actual greeting is generated fresh each time the chat opens."
          saveLabel="Save Opening Message"
        />
      </div>
    </div>
  );
}
