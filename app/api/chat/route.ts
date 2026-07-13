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

// Writing/articles are currently hidden from the site. The chat is muted to
// match: it receives no article index (buildSystemPrompt defaults to an empty
// one, so the prompt's Articles section is omitted) and is offered no
// read_article tool, so the assistant won't surface or link articles. The
// article routes and data layer stay in place — re-enabling is a clean revert.

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
    const systemPrompt = buildSystemPrompt(content, config.systemPrompt);

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
        // text. Throws if the model call fails (e.g. a retired-model 404) so the
        // fallback chain below can try the next model.
        let streamedText = '';
        const runModel = async (model: string) => {
          const working: Anthropic.MessageParam[] = anthropicMessages.map(
            (m) => ({ role: m.role, content: m.content })
          );

          const stream = anthropic.messages.stream({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: working,
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

          // Await completion so a mid-stream failure rejects here and the
          // fallback chain can move on to the next model.
          await stream.finalMessage();
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
