import { NextResponse } from 'next/server';
import puppeteerCore, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { prisma } from '@/lib/db';
import { getOrCreateSessionId } from '@/lib/session';
import { captureDecision, geoFromRequest } from '@/lib/capture';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function getBrowser(): Promise<Browser> {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // Local development - use full puppeteer
    const puppeteer = await import('puppeteer');
    return puppeteer.default.launch({
      headless: true,
    }) as Promise<Browser>;
  }

  // Production/Serverless - use puppeteer-core with chromium
  return puppeteerCore.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

export async function GET(request: Request) {
  let browser: Browser | null = null;

  try {
    // Get base URL from request or environment
    const url = new URL(request.url);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;

    browser = await getBrowser();
    const page = await browser.newPage();

    // Navigate to the print page
    await page.goto(`${baseUrl}/resume/print`, {
      waitUntil: 'networkidle0',
      timeout: 20000,
    });

    // Ensure web fonts are fully loaded before printing. Otherwise Chrome may
    // render text as non-embedded Type3 glyphs that different PDF viewers
    // (inline preview vs. downloaded file) substitute inconsistently.
    await page.evaluateHandle('document.fonts.ready');

    // Generate PDF - margins controlled via CSS @page and body padding
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
    });

    await browser.close();

    // Check if this is a preview request (display inline) or download
    const isPreview = url.searchParams.get('preview') === '1';

    // Record the download for the admin analytics dashboard — server-side so
    // both the site's download buttons and direct /api/pdf links are counted.
    // Preview renders are not downloads. Only after successful generation, and
    // never allowed to break the response (own try/catch).
    if (!isPreview) {
      try {
        const decision = await captureDecision();
        if (decision.record || decision.dryRun) {
          const event = {
            sessionId: await getOrCreateSessionId(),
            type: 'resume_download',
            country: geoFromRequest(request).country,
            userAgent: (request.headers.get('user-agent') ?? '').slice(0, 400),
          };
          if (decision.dryRun) {
            console.log(
              `[track] (noop${decision.isAdmin ? ', would skip: admin session' : ''})`,
              event
            );
          } else {
            await prisma.siteEvent.create({ data: event });
          }
        }
      } catch (trackError) {
        console.error('Resume download tracking error:', trackError);
      }
    }

    // Return PDF. Downloads are deliberately not CDN-cacheable: a cached
    // response would be served without invoking this function, silently
    // undercounting downloads (and Set-Cookie responses aren't cacheable
    // anyway). Only the inline preview keeps the CDN cache.
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isPreview
          ? 'inline'
          : 'attachment; filename="resume.pdf"',
        'Cache-Control': isPreview
          ? 'public, s-maxage=3600, stale-while-revalidate=86400'
          : 'private, no-store',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);

    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
