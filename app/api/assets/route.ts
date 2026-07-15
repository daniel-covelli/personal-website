import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { list, del } from '@vercel/blob';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Admin-only asset library backing the Assets tab. Browses (GET) and removes
// (DELETE) blobs in the same Vercel Blob store that header / Markdown image
// uploads write to. Uploads themselves go through /api/upload (client uploads);
// this route never touches file bytes, only lists and deletes.
//
// Requires BLOB_READ_WRITE_TOKEN — provisioned automatically when a Blob store
// is linked to the Vercel project (see .env.example). Without it we return 501
// so the UI can show a "not configured" note instead of a hard error.

function notConfigured() {
  return NextResponse.json(
    { error: 'Asset storage is not configured (missing Blob store)' },
    { status: 501 }
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return notConfigured();

  try {
    // Page through the store so every asset shows up even past the 1000-per-page
    // default. A personal site won't hit that, but the loop is cheap insurance.
    const blobs: {
      url: string;
      pathname: string;
      size: number;
      uploadedAt: Date;
    }[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ cursor, limit: 1000 });
      for (const b of page.blobs) {
        blobs.push({
          url: b.url,
          pathname: b.pathname,
          size: b.size,
          uploadedAt: b.uploadedAt,
        });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    // Newest first — the freshly uploaded asset is what you're usually after.
    blobs.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({ blobs });
  } catch (error) {
    console.error('Error listing assets:', error);
    return NextResponse.json(
      { error: 'Failed to list assets' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return notConfigured();

  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }
    // del() is idempotent — a missing blob resolves without error.
    await del(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
