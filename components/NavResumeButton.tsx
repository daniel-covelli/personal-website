'use client';

import { Download } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useResumeDownload } from '@/lib/useResumeDownload';

/**
 * Icon-only resume download in the top-right nav, matching the theme-toggle
 * icon button. Shows a spinner while the PDF renders.
 */
export default function NavResumeButton() {
  const { download, isDownloading } = useResumeDownload();

  return (
    <button
      type="button"
      onClick={download}
      disabled={isDownloading}
      aria-busy={isDownloading}
      aria-label="Download resume"
      title="Download resume"
      className="flex h-7 w-7 items-center justify-center rounded-full text-subtle transition-colors hover:bg-chip hover:text-ink disabled:cursor-not-allowed"
    >
      {isDownloading ? (
        <Spinner className="h-4 w-4" label="Downloading resume" />
      ) : (
        <Download className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
