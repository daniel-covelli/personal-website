'use client';

import { useResumeDownload } from '@/lib/useResumeDownload';

/** Footer text link that downloads the resume PDF (same flow as the hero CTA). */
export default function FooterResumeLink() {
  const { download, isDownloading } = useResumeDownload();

  return (
    <button
      type="button"
      onClick={download}
      disabled={isDownloading}
      aria-busy={isDownloading}
      className="text-[15px] text-ink transition-colors hover:text-brand disabled:text-subtle"
    >
      {isDownloading ? 'Preparing PDF…' : 'Resume'}
    </button>
  );
}
