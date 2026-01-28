import { NextResponse } from 'next/server';
import puppeteerCore, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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

    // Generate PDF - margins controlled via CSS @page and body padding
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
    });

    await browser.close();

    // Check if this is a preview request (display inline) or download
    const isPreview = url.searchParams.get('preview') === '1';

    // Return PDF
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isPreview
          ? 'inline'
          : 'attachment; filename="resume.pdf"',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
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
