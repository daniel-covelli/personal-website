import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getUserSelectableModels,
  saveModelCatalog,
  ChatModelInput,
  Provider,
  Lab,
} from '@/lib/models/catalog';

export const dynamic = 'force-dynamic';

// Public: the curated list a visitor may pick from. Safe to expose — it's just
// model metadata (no keys). Only enabled + userSelectable models are returned.
export async function GET() {
  try {
    const models = await getUserSelectableModels();
    return NextResponse.json({
      models: models.map((m) => ({
        modelId: m.modelId,
        label: m.label,
        lab: m.lab,
      })),
    });
  } catch (error) {
    console.error('Error reading selectable models:', error);
    return NextResponse.json({ models: [] });
  }
}

// Admin: replace the whole catalog (order = array order).
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { models?: unknown };
    const rows = Array.isArray(body.models) ? body.models : [];

    const cleaned: ChatModelInput[] = rows
      .filter(
        (m): m is Record<string, unknown> =>
          !!m &&
          typeof m === 'object' &&
          typeof (m as { modelId?: unknown }).modelId === 'string' &&
          (m as { modelId: string }).modelId.trim().length > 0
      )
      .map((m) => {
        const modelId = String(m.modelId).trim();
        return {
          provider: String(m.provider) as Provider,
          lab: String(m.lab) as Lab,
          modelId,
          label: (String(m.label ?? '').trim() || modelId) as string,
          enabled: Boolean(m.enabled),
          userSelectable: Boolean(m.userSelectable),
          sortOrder: 0,
        };
      });

    await saveModelCatalog(cleaned);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving chat models:', error);
    return NextResponse.json(
      { error: 'Failed to save chat models' },
      { status: 500 }
    );
  }
}
