import { prisma } from './db';
import {
  DEFAULT_SYSTEM_PROMPT_TEMPLATE,
  DEFAULT_GREETING_PROMPT_TEMPLATE,
} from './chat-template';

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

const nonEmpty = (v: string | null | undefined): string | null =>
  v && v.trim().length > 0 ? v : null;

/**
 * Reads the singleton config row once and resolves every field to its saved
 * value or built-in default. Callers needing more than one field should use this
 * rather than fetching per field. A DB error (e.g. an un-applied migration) falls
 * back to all-defaults so config can never take the chat down.
 */
export async function getChatConfig(): Promise<{
  models: string[];
  systemPrompt: string;
  greetingPrompt: string;
}> {
  try {
    const config = await prisma.chatConfig.findUnique({
      where: { id: 'singleton' },
    });
    const models = (config?.models ?? [])
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
    return {
      models: models.length > 0 ? models : DEFAULT_CHAT_MODELS,
      systemPrompt:
        nonEmpty(config?.systemPrompt) ?? DEFAULT_SYSTEM_PROMPT_TEMPLATE,
      greetingPrompt:
        nonEmpty(config?.greetingPrompt) ?? DEFAULT_GREETING_PROMPT_TEMPLATE,
    };
  } catch (error) {
    console.error('Failed to load chat config, using defaults:', error);
    return {
      models: DEFAULT_CHAT_MODELS,
      systemPrompt: DEFAULT_SYSTEM_PROMPT_TEMPLATE,
      greetingPrompt: DEFAULT_GREETING_PROMPT_TEMPLATE,
    };
  }
}

/** The configured model chain, falling back to the defaults. */
export async function getChatModels(): Promise<string[]> {
  return (await getChatConfig()).models;
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

/**
 * Persists one prompt-template field. Null or empty/whitespace clears the
 * override so the built-in default applies again.
 */
async function savePromptField(
  field: 'systemPrompt' | 'greetingPrompt',
  prompt: string | null
): Promise<void> {
  const value = nonEmpty(prompt);
  const data =
    field === 'systemPrompt'
      ? { systemPrompt: value }
      : { greetingPrompt: value };
  await prisma.chatConfig.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', models: [], ...data },
  });
}

export const saveSystemPromptTemplate = (prompt: string | null) =>
  savePromptField('systemPrompt', prompt);
export const saveGreetingPromptTemplate = (prompt: string | null) =>
  savePromptField('greetingPrompt', prompt);
