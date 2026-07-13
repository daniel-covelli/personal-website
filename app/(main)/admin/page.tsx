import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getContent } from '@/lib/content';
import { getChatConfig } from '@/lib/chat-config';
import { getAllArticles } from '@/lib/articles';
import {
  DEFAULT_SYSTEM_PROMPT_TEMPLATE,
  DEFAULT_GREETING_PROMPT_TEMPLATE,
} from '@/lib/chat-template';
import { buildSystemPrompt, buildGreetingPrompt } from '@/lib/chat';
import AdminTabs from '@/components/admin/AdminTabs';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/admin');
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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">
              Manage your resume content and chat assistant
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/resume/preview"
              target="_blank"
              className="text-sm text-blue-600 hover:underline"
            >
              Preview Resume
            </a>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <AdminTabs
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
  );
}
