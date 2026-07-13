'use client';

import { Download } from 'lucide-react';
import { MovingBorderButton } from '@/components/ui/moving-border-button';
import { Spinner } from '@/components/ui/spinner';
import { openChat } from '@/lib/chatLauncher';
import { useResumeDownload } from '@/lib/useResumeDownload';

/**
 * The two hero calls to action: a vibrant "Ask about me" button that opens the
 * assistant in its expanded view, and a quiet secondary button that downloads
 * the resume PDF (with a loading state while it renders).
 */
export default function HeroCtas() {
  const { download, isDownloading } = useResumeDownload();

  return (
    <div className="mt-7 flex flex-wrap items-center justify-center gap-4 md:justify-start">
      <MovingBorderButton
        onClick={() => openChat({ expanded: true })}
        aria-label="Ask about me"
        faceClassName="px-5 py-2.5 text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10.5h8M8 14h5m-9 6.5 3.2-2.4a2 2 0 0 1 1.2-.4H18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14.5Z"
          />
        </svg>
        Ask about me
      </MovingBorderButton>

      <button
        type="button"
        onClick={download}
        disabled={isDownloading}
        aria-busy={isDownloading}
        className="inline-flex items-center gap-2 rounded-full border border-hair px-4 py-2.5 text-sm font-medium text-body transition-colors hover:border-subtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isDownloading ? (
          <Spinner className="h-3.5 w-3.5" label="Downloading resume" />
        ) : (
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
        Download resume
      </button>
    </div>
  );
}
