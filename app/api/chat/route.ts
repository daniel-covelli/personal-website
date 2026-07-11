import { getContent } from '@/lib/content';
import { buildSystemPrompt, ChatMessage } from '@/lib/chat';
import { getOrCreateSessionId } from '@/lib/session';
import { getOrCreateConversation, addMessage } from '@/lib/conversations';
import {
  getFallbackChain,
  getUserSelectableModels,
  ChatModelEntry,
} from '@/lib/models/catalog';
import { getAdapter } from '@/lib/providers';

export const dynamic = 'force-dynamic';
// Bound the serverless function so a stalled model call can't hang indefinitely.
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const {
      messages,
      isGreeting,
      model: requestedModel,
    } = (await request.json()) as {
      messages: ChatMessage[];
      conversationId?: string;
      isGreeting?: boolean;
      model?: string;
    };

    const sessionId = await getOrCreateSessionId();
    const conversation = await getOrCreateConversation(sessionId);

    const content = await getContent();
    const systemPrompt = buildSystemPrompt(content);

    // The enabled models, in sortOrder, form the resilience fallback chain.
    const chain = await getFallbackChain();

    // A visitor may pick a model, but ONLY from the curated userSelectable set —
    // never an arbitrary (e.g. expensive) model. Validate server-side; an
    // invalid/disallowed pick is ignored and the default chain is used. A valid
    // pick is tried first, then we fall back through the rest of the chain.
    let attempt: ChatModelEntry[] = chain;
    if (!isGreeting && requestedModel) {
      const selectable = await getUserSelectableModels();
      const picked = selectable.find((m) => m.modelId === requestedModel);
      if (picked) {
        attempt = [picked, ...chain.filter((m) => m.id !== picked.id)];
      }
    }

    // Normalize into provider-agnostic messages.
    const providerMessages = isGreeting
      ? [
          {
            role: 'user' as const,
            content:
              'Introduce yourself in a casual, friendly way (1-2 sentences max). Keep it short and conversational - mention whose resume this is and that you can chat about their background. No formal language.',
          },
        ]
      : messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

    const maxTokens = isGreeting ? 150 : 1024;
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const send = (payload: unknown) =>
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );

        let streamedText = '';
        let attributionSent = false;

        // Streams one model's reply. On the first text delta (for a real chat
        // turn, not the greeting) it emits an `answeredBy` event so the client
        // can show which model actually responded — important because a picked
        // model may have failed and we fell through to another.
        const runModel = async (entry: ChatModelEntry) => {
          const adapter = getAdapter(entry.provider);
          for await (const { text } of adapter.streamChat({
            model: entry.modelId,
            system: systemPrompt,
            messages: providerMessages,
            maxTokens,
          })) {
            if (!attributionSent && !isGreeting) {
              attributionSent = true;
              send({
                answeredBy: {
                  modelId: entry.modelId,
                  label: entry.label,
                  lab: entry.lab,
                  provider: entry.provider,
                },
              });
            }
            streamedText += text;
            send({ text });
          }
        };

        try {
          send({ conversationId: conversation.id });

          // Try each model in order until one streams successfully. A retired
          // model (404), a missing provider key, or any error falls through to
          // the next in the chain.
          let succeeded = false;
          let lastError: unknown = null;
          for (const entry of attempt) {
            try {
              await runModel(entry);
              succeeded = true;
              break;
            } catch (modelError) {
              lastError = modelError;
              const status = (modelError as { status?: number })?.status;
              console.error(
                `Chat: model "${entry.modelId}" (${entry.provider}) failed (status ${status ?? 'unknown'})`,
                modelError
              );
              // Once any text has streamed, switching models would duplicate
              // output on the client — stop and surface the error.
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
          // The response is already a committed 200 stream, so we can't change
          // the status. Log it and send a structured error event the client
          // can render — never controller.error(), which hangs the client.
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
