import { useCallback, useRef, useState } from 'react';

/**
 * Downloads the resume PDF, exposing an `isDownloading` flag so buttons can show
 * a loading state. We fetch the PDF as a blob (rather than a plain <a download>)
 * because `/api/pdf` renders with Puppeteer and can take a moment — this lets us
 * know exactly when it finishes. Falls back to a direct navigation on error.
 */
export function useResumeDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const inFlight = useRef(false);

  const download = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsDownloading(true);
    try {
      const response = await fetch('/api/pdf');
      if (!response.ok)
        throw new Error(`PDF request failed: ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download resume:', error);
      window.open('/api/pdf', '_blank'); // fallback so the user still gets it
    } finally {
      inFlight.current = false;
      setIsDownloading(false);
    }
  }, []);

  return { download, isDownloading };
}
