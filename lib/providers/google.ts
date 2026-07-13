import { GoogleGenAI } from '@google/genai';
import { ProviderAdapter, StreamChatParams } from './types';

/**
 * Google Gemini adapter using `@google/genai` (the current unified SDK; the old
 * `@google/generative-ai` is deprecated). Validated against ai.google.dev
 * (2026-07):
 *   - streaming via `ai.models.generateContentStream`, text at `chunk.text`
 *   - system prompt via `config.systemInstruction` (separate from `contents`)
 *   - history roles use `'model'` (not `'assistant'`), content as `parts:[{text}]`
 *   - errors expose `.status`
 */
export const googleAdapter: ProviderAdapter = {
  async *streamChat({ model, system, messages, maxTokens }: StreamChatParams) {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY / GOOGLE_API_KEY');
    }
    const ai = new GoogleGenAI({ apiKey });

    // Map OpenAI-style {role, content} → Gemini contents. 'assistant' → 'model'.
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: system,
        maxOutputTokens: maxTokens,
      },
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) yield { text };
    }
  },
};
