import { deleteOldConversations } from '@/lib/conversations';

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deletedCount = await deleteOldConversations(30);

    return Response.json({
      success: true,
      deletedConversations: deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return Response.json({ error: 'Failed to run cleanup' }, { status: 500 });
  }
}
