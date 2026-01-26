import { NextResponse } from 'next/server';
import puppeteerCore, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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

    // Generate PDF
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    });

    await browser.close();

    // Return PDF as download
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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
