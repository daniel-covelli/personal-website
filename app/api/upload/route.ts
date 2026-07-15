import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { put } from '@vercel/blob';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Admin-only image upload. Stores the file in Vercel Blob and returns its public
// URL, which the admin editor drops into a `headerImageUrl` (or any Markdown
// image). Kept generic so the same endpoint can back body-image uploads later.
//
// Requires a BLOB_READ_WRITE_TOKEN env var — provisioned automatically when a
// Blob store is linked to the Vercel project (see .env.example).

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
]);

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Image uploads are not configured (missing Blob store)' },
      { status: 501 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type — use JPEG, PNG, WebP, GIF, AVIF, or SVG' },
        { status: 415 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File too large — max 5 MB' },
        { status: 413 }
      );
    }

    // `addRandomSuffix` avoids collisions and prevents one upload from
    // overwriting another that happens to share a filename.
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
