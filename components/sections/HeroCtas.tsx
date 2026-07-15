'use client';

import { ArrowRight, Download } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { openChat } from '@/lib/chatLauncher';
import { useBlinkingEyes } from '@/lib/useBlinkingEyes';
import { useResumeDownload } from '@/lib/useResumeDownload';

/**
 * The two hero calls to action. The primary is an "ask bar": a button styled
 * like the chat composer (blinking (@.@) agent face + prompt + arrow) that reads
 * as the start of a conversation but simply opens the assistant's expanded view.
 * Its gradient border reuses the floating launcher's nebula gradient (same
 * technique: the button is the gradient, a 1px pad reveals it as a ring, and an
 * inner panel holds the face) so the two chat entry points feel related and the
 * bar pops off the page. The secondary is a quiet button that downloads the
 * resume PDF (with a loading state while it renders).
 */
export default function HeroCtas() {
  const { download, isDownloading } = useResumeDownload();
  const eyesClosed = useBlinkingEyes();

  return (
    <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 md:justify-start">
      <button
        type="button"
        onClick={() => openChat({ expanded: true })}
        aria-label="Chat with Daniel's agent"
        className="group flex h-11 w-full max-w-sm rounded-2xl bg-[linear-gradient(125deg,#7c3aed_0%,#6366f1_55%,#4f46e5_100%)] p-0.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:bg-[linear-gradient(125deg,#db2777_0%,#7c3aed_50%,#4f46e5_100%)] sm:w-auto sm:min-w-[340px]"
      >
        <span className="flex w-full items-center gap-3 rounded-[14px] bg-[#edf0f4] px-4 text-left transition-colors duration-200 group-hover:bg-[#e3e7ec] dark:bg-panel dark:group-hover:bg-hair">
          <span
            aria-hidden="true"
            className="select-none font-mono text-[15px] font-semibold leading-none tracking-tight text-ink"
          >
            {eyesClosed ? '(-.-)' : '(@.@)'}
          </span>
          <span className="flex-1 text-[15px] text-subtle">
            Ask Daniel&apos;s agent…
          </span>
          <ArrowRight
            aria-hidden="true"
            className="h-[18px] w-[18px] shrink-0 text-subtle"
            strokeWidth={2}
          />
        </span>
      </button>

      <button
        type="button"
        onClick={download}
        disabled={isDownloading}
        aria-busy={isDownloading}
        className="inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium text-body transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-70"
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
