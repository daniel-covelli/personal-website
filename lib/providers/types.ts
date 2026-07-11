// Provider-agnostic chat plumbing. Each vendor adapter maps these normalized
// shapes into its own SDK's format, so the chat route never has to know which
// provider it's talking to.

export interface ProviderMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChatParams {
  /** The provider's own model ID string (e.g. "claude-haiku-4-5"). */
  model: string;
  /** System prompt; each adapter places it wherever its API expects. */
  system: string;
  /** Full conversation history, oldest first. */
  messages: ProviderMessage[];
  maxTokens: number;
}

export interface ProviderAdapter {
  /**
   * Streams incremental assistant text. Throws on failure (with a `.status`
   * where the SDK provides one) so the route can fall through to the next
   * model in the chain.
   */
  streamChat(params: StreamChatParams): AsyncIterable<{ text: string }>;
}
