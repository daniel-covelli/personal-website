import Anthropic from '@anthropic-ai/sdk';
import { getContent } from '@/lib/content';
import { buildSystemPrompt, ChatMessage } from '@/lib/chat';
import { getOrCreateSessionId } from '@/lib/session';
import { getOrCreateConversation, addMessage } from '@/lib/conversations';

export const dynamic = 'force-dynamic';
// Bound the serverless function so a stalled model call can't hang indefinitely.
export const maxDuration = 30;

const anthropic = new Anthropic();

// Anthropic retires dated model snapshots on a schedule — a retired ID returns
// 404 and (because the failure happens mid-stream) used to silently hang the
// chat. Use the rolling alias, and fall back to a second current model if the
// primary errors, so one retirement can't take the feature down.
const PRIMARY_MODEL = 'claude-haiku-4-5';
const FALLBACK_MODEL = 'claude-sonnet-5';

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

    const content = await getContent();
    const systemPrompt = buildSystemPrompt(content);

    let anthropicMessages: { role: 'user' | 'assistant'; content: string }[];

    if (isGreeting) {
      // For greeting, ask the assistant to introduce itself casually
      anthropicMessages = [
        {
          role: 'user',
          content:
            'Introduce yourself in a casual, friendly way (1-2 sentences max). Keep it short and conversational - mention whose resume this is and that you can chat about their background. No formal language.',
        },
      ];
    } else {
      anthropicMessages = messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
    }

    const maxTokens = isGreeting ? 150 : 1024;
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const send = (payload: unknown) =>
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );

        // Streams text deltas from `model` to the client, accumulating the full
        // text. Throws if the model call fails (e.g. a retired-model 404).
        let streamedText = '';
        const runModel = async (model: string) => {
          const stream = anthropic.messages.stream({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: anthropicMessages,
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
        };

        try {
          // Send conversation ID to client
          send({ conversationId: conversation.id });

          try {
            await runModel(PRIMARY_MODEL);
          } catch (primaryError) {
            const status = (primaryError as { status?: number })?.status;
            console.error(
              `Chat: ${PRIMARY_MODEL} failed (status ${status ?? 'unknown'}) — falling back to ${FALLBACK_MODEL}`,
              primaryError
            );
            // Only safe to retry when nothing has streamed yet; otherwise a
            // retry would duplicate text on the client.
            if (streamedText === '') {
              await runModel(FALLBACK_MODEL);
            } else {
              throw primaryError;
            }
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
