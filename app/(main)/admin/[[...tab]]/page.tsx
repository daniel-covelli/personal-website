import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getContent } from '@/lib/content';
import { getChatConfig } from '@/lib/chat-config';
import { getAllArticles } from '@/lib/articles';
import {
  DEFAULT_SYSTEM_PROMPT_TEMPLATE,
  DEFAULT_GREETING_PROMPT_TEMPLATE,
} from '@/lib/chat-template';
import { buildSystemPrompt, buildGreetingPrompt } from '@/lib/chat';
import AdminTabs, { isTabId, type TabId } from '@/components/admin/AdminTabs';
import LogoutButton from '../LogoutButton';
import { ThemeProvider } from '@/components/ThemeProvider';
import ThemeToggle from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

interface AdminPageProps {
  // Optional catch-all: /admin (resume tab) or /admin/<tab>.
  params: { tab?: string[] };
}

export default async function AdminPage({ params }: AdminPageProps) {
  const segments = params.tab ?? [];
  if (segments.length > 1 || (segments.length === 1 && !isTabId(segments[0]))) {
    notFound();
  }
  const initialTab: TabId = segments.length ? (segments[0] as TabId) : 'resume';

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(
        segments.length ? `/admin/${initialTab}` : '/admin'
      )}`
    );
  }

  const [content, config, articles] = await Promise.all([
    getContent(),
    getChatConfig(),
    getAllArticles(),
  ]);

  // The article index the assistant actually sees is published-only; build it
  // here so the system-prompt preview shows the same Articles section the chat
  // would receive.
  const publishedArticleIndex = articles
    .filter((a) => a.published)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      tags: a.tags,
      publishedAt: a.publishedAt,
    }));

  // Render the in-effect templates server-side (reusing the already-loaded resume
  // content, no extra query) so each editor's live preview paints instantly on
  // expand; edits re-render via /api/chat-config. Keeps liquidjs out of the bundle.
  const initialRenderedSystemPrompt = buildSystemPrompt(
    content,
    config.systemPrompt,
    publishedArticleIndex
  );
  const initialRenderedGreeting = buildGreetingPrompt(
    content,
    config.greetingPrompt
  );

  return (
    // zoom scales the entire admin (header, tabs, editors, live preview) down
    // uniformly so more fits on screen; adjust the factor to taste.
    <ThemeProvider>
      <div className="min-h-screen bg-surface" style={{ zoom: 0.8 }}>
        <header className="border-b border-hair bg-panel">
          <div className="mx-auto flex max-w-[1800px] items-center justify-between px-4 py-2.5">
            <div>
              <h1 className="text-base font-bold text-ink">Admin Dashboard</h1>
              <p className="text-xs text-subtle">
                Manage your resume content and chat assistant
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/resume/preview"
                target="_blank"
                className="text-sm text-brand hover:underline"
              >
                Preview Resume
              </a>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1800px] px-4 py-5">
          <AdminTabs
            initialTab={initialTab}
            content={content}
            chatModels={config.models}
            articles={articles}
            systemPrompt={config.systemPrompt}
            defaultSystemPrompt={DEFAULT_SYSTEM_PROMPT_TEMPLATE}
            initialRenderedSystemPrompt={initialRenderedSystemPrompt}
            greetingPrompt={config.greetingPrompt}
            defaultGreetingPrompt={DEFAULT_GREETING_PROMPT_TEMPLATE}
            initialRenderedGreeting={initialRenderedGreeting}
          />
        </main>
      </div>
    </ThemeProvider>
  );
}
