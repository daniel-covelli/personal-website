import { getSessionId } from '@/lib/session';
import { getConversationBySessionId } from '@/lib/conversations';

export async function GET() {
  try {
    const sessionId = await getSessionId();

    if (!sessionId) {
      return Response.json({ conversation: null });
    }

    const conversation = await getConversationBySessionId(sessionId);

    return Response.json({
      conversation: conversation
        ? {
            id: conversation.id,
            messages: conversation.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return Response.json({ conversation: null });
  }
}
