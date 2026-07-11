import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getChatModels, saveChatModels } from '@/lib/chat-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const models = await getChatModels();
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error reading chat config:', error);
    return NextResponse.json(
      { error: 'Failed to read chat config' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { models?: unknown };
    const models = Array.isArray(body.models)
      ? body.models.filter((m): m is string => typeof m === 'string')
      : [];

    await saveChatModels(models);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving chat config:', error);
    return NextResponse.json(
      { error: 'Failed to save chat config' },
      { status: 500 }
    );
  }
}
