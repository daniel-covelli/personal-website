import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSessionId } from '@/lib/session';
import {
  getConversationBySessionId,
  deleteConversationBySessionId,
} from '@/lib/conversations';

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

export async function DELETE() {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = await getSessionId();
    if (!sessionId) {
      return Response.json({ error: 'No session found' }, { status: 400 });
    }

    const deleted = await deleteConversationBySessionId(sessionId);

    return Response.json({ success: deleted });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return Response.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
