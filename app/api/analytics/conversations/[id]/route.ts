import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getConversationById } from '@/lib/conversations';

export const dynamic = 'force-dynamic';

// Admin-only transcript fetch for the analytics dashboard's drill-down.
// 404 also covers conversations removed by the 30-day cleanup cron.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversation = await getConversationById(params.id);
    if (!conversation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        createdAt: conversation.createdAt,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Transcript fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load conversation' },
      { status: 500 }
    );
  }
}
