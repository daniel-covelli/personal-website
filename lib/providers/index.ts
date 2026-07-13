import { ProviderAdapter } from './types';
import { anthropicAdapter } from './anthropic';
import { makeOpenAICompatibleAdapter } from './openai-compatible';
import { googleAdapter } from './google';

// Maps a ChatModel.provider value to its adapter. OpenAI, Groq, and Together
// all share the OpenAI-compatible adapter (only baseURL + key differ). A
// provider missing here — or one whose API key isn't set (the adapter throws) —
// is treated by the chat route as a model failure and falls through to the next
// model, so misconfiguration degrades gracefully.
const ADAPTERS: Partial<Record<string, ProviderAdapter>> = {
  anthropic: anthropicAdapter,
  openai: makeOpenAICompatibleAdapter({
    apiKeyEnv: 'OPENAI_API_KEY',
    tokenParam: 'max_completion_tokens',
  }),
  groq: makeOpenAICompatibleAdapter({
    apiKeyEnv: 'GROQ_API_KEY',
    baseURL: 'https://api.groq.com/openai/v1',
  }),
  together: makeOpenAICompatibleAdapter({
    apiKeyEnv: 'TOGETHER_API_KEY',
    baseURL: 'https://api.together.ai/v1',
  }),
  google: googleAdapter,
};

export function getAdapter(provider: string): ProviderAdapter {
  const adapter = ADAPTERS[provider];
  if (!adapter) {
    throw new Error(`No adapter configured for provider "${provider}"`);
  }
  return adapter;
}

export type {
  ProviderAdapter,
  StreamChatParams,
  ProviderMessage,
} from './types';
