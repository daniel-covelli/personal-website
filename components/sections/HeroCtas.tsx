'use client';

import { Download } from 'lucide-react';
import { MovingBorderButton } from '@/components/ui/moving-border-button';
import { Spinner } from '@/components/ui/spinner';
import { openChat } from '@/lib/chatLauncher';
import { useResumeDownload } from '@/lib/useResumeDownload';

/**
 * The two hero calls to action: a vibrant "Interview me" button that opens the
 * assistant in its expanded view, and a quiet secondary button that downloads
 * the resume PDF (with a loading state while it renders).
 */
export default function HeroCtas() {
  const { download, isDownloading } = useResumeDownload();

  return (
    <div className="mt-7 flex flex-wrap items-center justify-center gap-4 md:justify-start">
      <MovingBorderButton
        onClick={() => openChat({ expanded: true })}
        aria-label="Chat with my agent"
        faceClassName="px-5 py-2.5 text-sm"
      >
        <span
          aria-hidden="true"
          className="-translate-y-[0.02em] select-none font-mono text-[12.5px] font-semibold leading-none tracking-tight"
        >
          (@.@)
        </span>
        Chat with my agent
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
