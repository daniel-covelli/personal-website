import Anthropic from '@anthropic-ai/sdk';
import { getContent } from '@/lib/content';
import {
  buildSystemPrompt,
  buildGreetingPrompt,
  ChatMessage,
} from '@/lib/chat';
import { getOrCreateSessionId } from '@/lib/session';
import { getOrCreateConversation, addMessage } from '@/lib/conversations';
import { getChatConfig } from '@/lib/chat-config';
import {
  getArticleIndex,
  getArticleBySlug,
  formatArticleForAgent,
} from '@/lib/articles';
import { ArticleIndexEntry } from '@/lib/types';

// The assistant carries only a lightweight index of articles in its prompt and
// pulls a full body on demand with this tool. Keeps the prompt small no matter
// how many articles exist, and lets a visitor "drill down" on any post.
const tools: Anthropic.Tool[] = [
  {
    name: 'read_article',
    description:
      "Load the full Markdown text of one of the site's published articles by its slug. Only the article index (titles, summaries, slugs) is in your context by default — call this before answering anything specific about an article's contents, code, or diagrams. The mermaid diagram source is included, so you can read diagrams too.",
    input_schema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description:
            'The slug of the article to read, taken from the Articles index in the system prompt.',
        },
      },
      required: ['slug'],
    },
  },
];

// Cap the read_article rounds so a confused model can't loop forever; on the
// final round tools are withheld, forcing a text answer.
const MAX_TOOL_ROUNDS = 4;

export const dynamic = 'force-dynamic';
// Bound the serverless function so a stalled model call can't hang indefinitely.
export const maxDuration = 30;

const anthropic = new Anthropic();

// The chat tries an ordered list of models (managed from /admin, see
// lib/chat-config.ts) until one succeeds. Anthropic retires model families on a
// schedule — a retired ID returns 404 and, because the failure happens
// mid-stream, used to silently hang the chat. The ordered fallback chain means
// one retirement can't take the feature down, and the list can be updated
// without a code change or redeploy.

export async function POST(request: Request) {
  try {
    const { messages, isGreeting } = (await request.json()) as {
      messages: ChatMessage[];
      conversationId?: string;
      isGreeting?: boolean;
    };

    // Get or create session
    const sessionId = await getOrCreateSessionId();

    // Get or create conversation
    const conversation = await getOrCreateConversation(sessionId);

    const [content, config] = await Promise.all([
      getContent(),
      getChatConfig(),
    ]);
    // A DB hiccup on the article index must never take the chat down — fall
    // back to an empty index (same defensive posture as getChatConfig).
    let articleIndex: ArticleIndexEntry[] = [];
    try {
      articleIndex = await getArticleIndex();
    } catch (indexError) {
      console.error('Failed to load article index for chat:', indexError);
    }
    const systemPrompt = buildSystemPrompt(
      content,
      config.systemPrompt,
      articleIndex
    );
    const models = config.models;

    let anthropicMessages: { role: 'user' | 'assistant'; content: string }[];

    if (isGreeting) {
      // The opening message is generated from an editable instruction template
      // rendered against the same resume context. Tone/personality come from the
      // system prompt above; this only steers WHAT the first message says.
      anthropicMessages = [
        {
          role: 'user',
          content: buildGreetingPrompt(content, config.greetingPrompt),
        },
      ];
    } else {
      anthropicMessages = messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
    }

    // The greeting instruction is admin-configurable and may ask for more than a
    // one-liner, so give it a little headroom (beyond the old 1-2 sentence intro)
    // to avoid cutting a longer opening message off mid-sentence.
    const maxTokens = isGreeting ? 250 : 1024;
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const send = (payload: unknown) =>
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );

        // Streams text deltas from `model` to the client, accumulating the full
        // text. Runs an agentic loop: if the model calls read_article, the
        // article is fetched, fed back as a tool result, and the model
        // continues — all while text keeps streaming to the client. Throws if
        // the model call fails (e.g. a retired-model 404).
        let streamedText = '';
        const runModel = async (model: string) => {
          const working: Anthropic.MessageParam[] = anthropicMessages.map(
            (m) => ({ role: m.role, content: m.content })
          );

          for (let round = 0; ; round++) {
            // Greeting turns never use tools; on the last round tools are
            // withheld so the model must answer instead of calling again.
            const useTools = !isGreeting && round < MAX_TOOL_ROUNDS;
            const stream = anthropic.messages.stream({
              model,
              max_tokens: maxTokens,
              system: systemPrompt,
              messages: working,
              ...(useTools ? { tools } : {}),
            });

            for await (const event of stream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                streamedText += event.delta.text;
                send({ text: event.delta.text });
              }
            }

            const finalMessage = await stream.finalMessage();
            if (finalMessage.stop_reason !== 'tool_use') return;

            // Record the assistant's tool-calling turn, then resolve each
            // read_article call and hand the results back for the next round.
            working.push({ role: 'assistant', content: finalMessage.content });
            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const block of finalMessage.content) {
              if (block.type !== 'tool_use') continue;
              if (block.name === 'read_article') {
                const rawSlug = (block.input as { slug?: unknown })?.slug;
                const slug = typeof rawSlug === 'string' ? rawSlug : '';
                let article = null;
                try {
                  article = slug ? await getArticleBySlug(slug) : null;
                } catch (readError) {
                  console.error('read_article lookup failed:', readError);
                }
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: article
                    ? formatArticleForAgent(article)
                    : `No published article found with slug "${slug}". Check the Articles index for valid slugs.`,
                  ...(article ? {} : { is_error: true }),
                });
              } else {
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: `Unknown tool "${block.name}".`,
                  is_error: true,
                });
              }
            }
            working.push({ role: 'user', content: toolResults });
          }
        };

        try {
          // Send conversation ID to client
          send({ conversationId: conversation.id });

          // Try each configured model in order until one streams successfully.
          // This is the resilience mechanism: if a model is retired (404) or
          // errors, we fall through to the next in the chain.
          let succeeded = false;
          let lastError: unknown = null;
          for (const model of config.models) {
            try {
              await runModel(model);
              succeeded = true;
              break;
            } catch (modelError) {
              lastError = modelError;
              const status = (modelError as { status?: number })?.status;
              console.error(
                `Chat: model "${model}" failed (status ${status ?? 'unknown'})`,
                modelError
              );
              // Once any text has streamed to the client, retrying a different
              // model would duplicate output — stop and surface the error.
              if (streamedText !== '') break;
              // Otherwise fall through to the next model in the chain.
            }
          }

          if (!succeeded) {
            throw lastError ?? new Error('All configured chat models failed');
          }

          // Persist the exchange only after a successful reply, so a failed
          // request doesn't leave an orphaned user turn in the history.
          if (!isGreeting) {
            const latestUserMessage = messages[messages.length - 1];
            if (latestUserMessage?.role === 'user') {
              await addMessage(
                conversation.id,
                'user',
                latestUserMessage.content
              );
            }
          }
          if (streamedText) {
            await addMessage(conversation.id, 'assistant', streamedText);
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          // The response is already committed as a 200 stream, so we cannot
          // change the status. Log it (surfaces in Vercel) and send a
          // structured error event the client can render — never
          // controller.error(), which aborts the stream and hangs the client.
          console.error('Chat streaming error:', error);
          try {
            send({
              error:
                'The assistant is unavailable right now. Please try again.',
            });
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch {
            // Client already disconnected — nothing more to do.
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
