import Anthropic from '@anthropic-ai/sdk';
import { getContent } from '@/lib/content';
import { buildSystemPrompt, ChatMessage } from '@/lib/chat';
import { getOrCreateSessionId } from '@/lib/session';
import { getOrCreateConversation, addMessage } from '@/lib/conversations';

const anthropic = new Anthropic();

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as {
      messages: ChatMessage[];
      conversationId?: string;
    };

    // Get or create session
    const sessionId = await getOrCreateSessionId();

    // Get or create conversation
    const conversation = await getOrCreateConversation(sessionId);

    const content = await getContent();
    const systemPrompt = buildSystemPrompt(content);

    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage?.role === 'user') {
      // Save user message to database
      await addMessage(conversation.id, 'user', latestUserMessage.content);
    }

    const anthropicMessages = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const encoder = new TextEncoder();
    let fullResponse = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID to client
          const initData = JSON.stringify({ conversationId: conversation.id });
          controller.enqueue(encoder.encode(`data: ${initData}\n\n`));

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullResponse += event.delta.text;
              const data = JSON.stringify({ text: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Save assistant message to database after streaming completes
          if (fullResponse) {
            await addMessage(conversation.id, 'assistant', fullResponse);
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
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
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
