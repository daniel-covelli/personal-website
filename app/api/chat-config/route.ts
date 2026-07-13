import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getChatModels,
  saveChatModels,
  saveSystemPromptTemplate,
} from '@/lib/chat-config';
import { validateTemplate } from '@/lib/chat';

export const dynamic = 'force-dynamic';

// Guardrail against an accidental/abusive multi-megabyte payload. Well above any
// realistic prompt (the default is ~1KB) but bounded.
const MAX_SYSTEM_PROMPT_LENGTH = 100_000;

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

    const body = (await request.json()) as {
      models?: unknown;
      systemPrompt?: unknown;
    };

    // Each field is optional and saved independently, so the models editor and
    // the system-prompt editor can each PUT just the piece they own.
    if ('models' in body) {
      const models = Array.isArray(body.models)
        ? body.models.filter((m): m is string => typeof m === 'string')
        : [];
      await saveChatModels(models);
    }

    if ('systemPrompt' in body) {
      const { systemPrompt } = body;
      if (systemPrompt !== null && typeof systemPrompt !== 'string') {
        return NextResponse.json(
          { error: 'systemPrompt must be a string or null' },
          { status: 400 }
        );
      }
      if (
        typeof systemPrompt === 'string' &&
        systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH
      ) {
        return NextResponse.json(
          { error: 'System prompt is too long' },
          { status: 400 }
        );
      }
      // Reject a malformed Liquid template here so the admin gets immediate
      // feedback instead of a silently-broken chat. Empty/whitespace clears the
      // override (validates trivially) and is normalised to "use the default"
      // inside the lib.
      if (typeof systemPrompt === 'string') {
        const templateError = validateTemplate(systemPrompt);
        if (templateError) {
          return NextResponse.json(
            { error: `Invalid template: ${templateError}` },
            { status: 400 }
          );
        }
      }
      await saveSystemPromptTemplate(systemPrompt);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving chat config:', error);
    return NextResponse.json(
      { error: 'Failed to save chat config' },
      { status: 500 }
    );
  }
}
