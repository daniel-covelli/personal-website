import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getChatModels,
  saveChatModels,
  saveSystemPromptTemplate,
  saveGreetingPromptTemplate,
} from '@/lib/chat-config';
import { renderTemplatePreview, validateTemplate } from '@/lib/chat';
import { getContent } from '@/lib/content';

export const dynamic = 'force-dynamic';

// Guardrail against an accidental/abusive multi-megabyte payload. Well above any
// realistic prompt (~1KB) but bounded.
const MAX_TEMPLATE_LENGTH = 100_000;

// The editable prompt-template fields the PUT handler validates and saves. Adding
// a third prompt is one row here, not another copy-pasted validation block.
const TEMPLATE_FIELDS = [
  {
    key: 'systemPrompt',
    label: 'System prompt',
    save: saveSystemPromptTemplate,
  },
  {
    key: 'greetingPrompt',
    label: 'Greeting prompt',
    save: saveGreetingPromptTemplate,
  },
] as const;

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

// POST { template } -> { rendered } | 400 { error }. Renders a candidate template
// for the admin editors' live preview; read-only, never persists. Kept prompt-
// agnostic (any template) so both editors share it.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { template?: unknown };
    const { template } = body;

    if (typeof template !== 'string') {
      return NextResponse.json(
        { error: 'template must be a string' },
        { status: 400 }
      );
    }
    if (template.length > MAX_TEMPLATE_LENGTH) {
      return NextResponse.json(
        { error: 'Template is too long' },
        { status: 400 }
      );
    }

    const content = await getContent();
    // Writing/articles are currently hidden site-wide and the live chat receives
    // an empty article index, so preview with none too — the preview then matches
    // exactly what the chat renders.
    try {
      const rendered = renderTemplatePreview(content, template);
      return NextResponse.json({ rendered });
    } catch (error) {
      // Parse or render failure for the candidate template — surface it so the
      // editor shows the admin what's wrong instead of a silent fallback.
      const message =
        error instanceof Error ? error.message : 'Invalid template';
      return NextResponse.json(
        { error: `Invalid template: ${message}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error rendering template preview:', error);
    return NextResponse.json(
      { error: 'Failed to render preview' },
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
      greetingPrompt?: unknown;
    };

    // Each field is optional and saved independently, so each editor can PUT just
    // the piece it owns.
    if ('models' in body) {
      const models = Array.isArray(body.models)
        ? body.models.filter((m): m is string => typeof m === 'string')
        : [];
      await saveChatModels(models);
    }

    for (const { key, label, save } of TEMPLATE_FIELDS) {
      if (!(key in body)) continue;
      const value = body[key];
      if (value !== null && typeof value !== 'string') {
        return NextResponse.json(
          { error: `${label} must be a string or null` },
          { status: 400 }
        );
      }
      if (typeof value === 'string') {
        if (value.length > MAX_TEMPLATE_LENGTH) {
          return NextResponse.json(
            { error: `${label} is too long` },
            { status: 400 }
          );
        }
        // Reject a malformed Liquid template here so the admin gets immediate
        // feedback instead of a silently-broken chat. Empty/whitespace clears the
        // override (validates trivially) and is normalised to the default in lib.
        const templateError = validateTemplate(value);
        if (templateError) {
          return NextResponse.json(
            { error: `Invalid template: ${templateError}` },
            { status: 400 }
          );
        }
      }
      await save(value);
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
