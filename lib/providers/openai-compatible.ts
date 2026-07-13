import OpenAI from 'openai';
import { ProviderAdapter, StreamChatParams } from './types';

interface OpenAICompatConfig {
  /** Override baseURL for OpenAI-compatible hosts (Groq, Together). Omit for OpenAI itself. */
  baseURL?: string;
  /** Env var holding the API key for this host. */
  apiKeyEnv: string;
  /**
   * OpenAI's newest models require `max_completion_tokens`; the classic hosts
   * (Groq/Together) use `max_tokens`. Defaults to `max_tokens`.
   */
  tokenParam?: 'max_tokens' | 'max_completion_tokens';
}

/**
 * Adapter over any OpenAI-compatible Chat Completions endpoint. OpenAI, Groq,
 * and Together all speak the same wire protocol — only baseURL + key differ. We
 * use Chat Completions (not the Responses API) because Groq/Together only
 * implement Chat Completions.
 *
 * Validated against official docs (2026-07):
 *   - OpenAI: `chunk.choices[0].delta.content`, `err.status` — developers.openai.com
 *   - Groq baseURL https://api.groq.com/openai/v1 — console.groq.com/docs/openai
 *   - Together baseURL https://api.together.ai/v1 — docs.together.ai
 */
export function makeOpenAICompatibleAdapter(
  config: OpenAICompatConfig
): ProviderAdapter {
  return {
    async *streamChat({
      model,
      system,
      messages,
      maxTokens,
    }: StreamChatParams) {
      const apiKey = process.env[config.apiKeyEnv];
      if (!apiKey) {
        // No key configured — surface as a normal failure so the route falls
        // through to the next model instead of hanging.
        throw new Error(`Missing ${config.apiKeyEnv}`);
      }
      const client = new OpenAI({ apiKey, baseURL: config.baseURL });

      const tokenField =
        config.tokenParam === 'max_completion_tokens'
          ? { max_completion_tokens: maxTokens }
          : { max_tokens: maxTokens };

      // maxRetries: 0 so a mid-stream failure reaches our fallback logic rather
      // than the SDK silently retrying.
      const stream = await client.chat.completions.create(
        {
          model,
          stream: true,
          messages: [{ role: 'system', content: system }, ...messages],
          ...tokenField,
        },
        { maxRetries: 0 }
      );

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) yield { text };
      }
    },
  };
}
