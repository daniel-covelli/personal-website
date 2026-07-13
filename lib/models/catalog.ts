import { prisma } from '@/lib/db';

export type Provider = 'anthropic' | 'openai' | 'google' | 'groq' | 'together';
export type Lab = 'anthropic' | 'openai' | 'google' | 'meta' | 'mistral';

export interface ChatModelEntry {
  id: string;
  provider: Provider;
  lab: Lab;
  modelId: string;
  label: string;
  enabled: boolean;
  userSelectable: boolean;
  sortOrder: number;
}

export type ChatModelInput = Omit<ChatModelEntry, 'id'>;

/**
 * Baked-in default catalog: used when the DB has no chat_models rows (fresh
 * install / un-applied migration) or the query fails. Anthropic is enabled
 * because ANTHROPIC_API_KEY already exists; the other providers ship present
 * but DISABLED so they appear in /admin ready to switch on once their keys are
 * configured. Nothing is userSelectable until rate limiting lands (#22), so the
 * visitor picker stays hidden by default.
 *
 * NOTE: non-Anthropic modelIds are filled in from the provider-doc validation
 * pass — see lib/providers/.
 */
export const DEFAULT_CATALOG: ChatModelInput[] = [
  {
    provider: 'anthropic',
    lab: 'anthropic',
    modelId: 'claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    enabled: true,
    userSelectable: false,
    sortOrder: 0,
  },
  {
    provider: 'anthropic',
    lab: 'anthropic',
    modelId: 'claude-sonnet-5',
    label: 'Claude Sonnet 5',
    enabled: true,
    userSelectable: false,
    sortOrder: 1,
  },
  {
    provider: 'anthropic',
    lab: 'anthropic',
    modelId: 'claude-opus-4-8',
    label: 'Claude Opus 4.8',
    enabled: true,
    userSelectable: false,
    sortOrder: 2,
  },
  // Other providers ship DISABLED — they appear in /admin ready to switch on
  // once their API keys are configured. Model IDs validated against each
  // provider's docs (2026-07). See lib/providers/ for the adapters.
  {
    provider: 'openai',
    lab: 'openai',
    modelId: 'gpt-5.4-mini',
    label: 'GPT-5.4 mini',
    enabled: false,
    userSelectable: false,
    sortOrder: 3,
  },
  {
    provider: 'google',
    lab: 'google',
    modelId: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    enabled: false,
    userSelectable: false,
    sortOrder: 4,
  },
  {
    provider: 'groq',
    lab: 'meta',
    modelId: 'llama-3.3-70b-versatile',
    label: 'Llama 3.3 70B',
    enabled: false,
    userSelectable: false,
    sortOrder: 5,
  },
  {
    provider: 'together',
    lab: 'mistral',
    modelId: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    label: 'Mixtral 8x7B',
    enabled: false,
    userSelectable: false,
    sortOrder: 6,
  },
];

function withSyntheticIds(entries: ChatModelInput[]): ChatModelEntry[] {
  return entries.map((e, i) => ({ ...e, id: `default-${i}` }));
}

/** The full catalog (DB rows if any, else the baked-in defaults). */
export async function getModelCatalog(): Promise<ChatModelEntry[]> {
  try {
    const rows = await prisma.chatModel.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    if (rows.length === 0) return withSyntheticIds(DEFAULT_CATALOG);
    return rows.map((r) => ({
      id: r.id,
      provider: r.provider as Provider,
      lab: r.lab as Lab,
      modelId: r.modelId,
      label: r.label,
      enabled: r.enabled,
      userSelectable: r.userSelectable,
      sortOrder: r.sortOrder,
    }));
  } catch (error) {
    // Missing table (un-applied migration) or any DB hiccup: never let config
    // take the chat down — fall back to the built-in catalog.
    console.error('Failed to load chat model catalog, using defaults:', error);
    return withSyntheticIds(DEFAULT_CATALOG);
  }
}

/** Enabled models in fallback order — the resilience chain. */
export async function getFallbackChain(): Promise<ChatModelEntry[]> {
  const catalog = await getModelCatalog();
  return catalog.filter((m) => m.enabled);
}

/** Curated models a visitor is allowed to pick. */
export async function getUserSelectableModels(): Promise<ChatModelEntry[]> {
  const catalog = await getModelCatalog();
  return catalog.filter((m) => m.enabled && m.userSelectable);
}

/** Replace the whole catalog (delete-all + recreate, like lib/content.ts). */
export async function saveModelCatalog(
  entries: ChatModelInput[]
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.chatModel.deleteMany({});
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      await tx.chatModel.create({
        data: {
          provider: e.provider,
          lab: e.lab,
          modelId: e.modelId,
          label: e.label,
          enabled: e.enabled,
          userSelectable: e.userSelectable,
          sortOrder: i,
        },
      });
    }
  });
}
