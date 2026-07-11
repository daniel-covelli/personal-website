import Anthropic from '@anthropic-ai/sdk';
import { ProviderAdapter, StreamChatParams } from './types';

// A single shared client; reads ANTHROPIC_API_KEY from the environment.
const anthropic = new Anthropic();

export const anthropicAdapter: ProviderAdapter = {
  async *streamChat({ model, system, messages, maxTokens }: StreamChatParams) {
    const stream = anthropic.messages.stream({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    });
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield { text: event.delta.text };
      }
    }
  },
};
