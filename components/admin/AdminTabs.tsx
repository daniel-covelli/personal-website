'use client';

import { useEffect, useMemo, useState } from 'react';
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

type TabId = (typeof TABS)[number]['id'];

export default function AdminTabs({
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
  const [activeTab, setActiveTab] = useState<TabId>('resume');

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

  // Honor a #tab hash (e.g. /admin#writing from the "New article" link) after
  // mount — set post-hydration to avoid an SSR/client markup mismatch.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (TABS.some((t) => t.id === hash)) {
      setActiveTab(hash as TabId);
    }
  }, []);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Admin sections"
        className="mb-4 flex gap-1 border-b border-gray-200"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
                className="text-blue-600 hover:underline"
              >
                Liquid
              </a>{' '}
              template — your resume is injected as variables when the assistant
              runs, so it always reflects the latest Resume tab content. Drop in{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">
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
              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">
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
