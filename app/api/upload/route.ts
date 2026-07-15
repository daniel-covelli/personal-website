import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Admin-only image upload backing the Assets tab (and thus any article header
// or Markdown image, which reference the uploaded URLs). Uses Vercel Blob
// *client uploads*: the browser streams the file straight to Blob storage and
// this route only mints a short-lived, admin-gated upload token.
//
// Why not stream the file through this function? A route that read the file
// itself (`request.formData()` + `put`) is capped by Vercel's 4.5 MB Function
// request-body limit — anything larger is rejected at the edge with
// FUNCTION_PAYLOAD_TOO_LARGE before the handler ever runs. Client uploads skip
// the function body entirely and support files up to 5 TB.
//
// Requires a BLOB_READ_WRITE_TOKEN env var — provisioned automatically when a
// Blob store is linked to the Vercel project (see .env.example).

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
];

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Image uploads are not configured (missing Blob store)' },
      { status: 501 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      request,
      body,
      // Runs when the browser requests an upload token. Gate it on an admin
      // session and pin down what may be uploaded (type + size) — the token
      // encodes these limits so Blob enforces them during the direct upload.
      onBeforeGenerateToken: async () => {
        const session = await getServerSession(authOptions);
        if (!session) {
          throw new Error('Unauthorized');
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      // Blob calls this from its own servers once the direct upload finishes.
      // We persist nothing — the client already has the URL from `upload()`.
      // (Not invoked on localhost, which has no public callback URL; fine here.)
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json(
      { error: message },
      { status: message === 'Unauthorized' ? 401 : 400 }
    );
  }
}
