import { prisma } from './db';

/**
 * The chat assistant tries these model IDs in order until one succeeds (see
 * app/api/chat/route.ts). The list lives in the database (editable from /admin)
 * so a model retirement can be fixed without a code change or redeploy.
 *
 * This baked-in default is the safety net: it is used whenever the DB row is
 * missing/empty OR the query fails (e.g. the migration hasn't been applied
 * yet), so the chat always has a sane fallback chain and can never be taken
 * down by a single model being retired.
 *
 * Spans three families on purpose — all three would have to be retired at once
 * for the default to fail.
 */
export const DEFAULT_CHAT_MODELS = [
  'claude-haiku-4-5',
  'claude-sonnet-5',
  'claude-opus-4-8',
];

/** Returns the configured model chain, falling back to the defaults. */
export async function getChatModels(): Promise<string[]> {
  try {
    const config = await prisma.chatConfig.findUnique({
      where: { id: 'singleton' },
    });
    const models = (config?.models ?? [])
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
    return models.length > 0 ? models : DEFAULT_CHAT_MODELS;
  } catch (error) {
    // Missing table (un-applied migration) or any DB hiccup: never let config
    // take the chat down — fall back to the built-in chain.
    console.error('Failed to load chat model config, using defaults:', error);
    return DEFAULT_CHAT_MODELS;
  }
}

/** Persists the ordered model chain (empty entries are dropped). */
export async function saveChatModels(models: string[]): Promise<void> {
  const cleaned = models.map((m) => m.trim()).filter((m) => m.length > 0);
  await prisma.chatConfig.upsert({
    where: { id: 'singleton' },
    update: { models: cleaned },
    create: { id: 'singleton', models: cleaned },
  });
}
