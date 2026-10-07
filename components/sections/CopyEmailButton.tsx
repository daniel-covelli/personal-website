'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard refused (insecure context / permissions); the address is
      // still selectable text right beside the button.
    }
  };

  const Icon = copied ? Check : Copy;

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Email copied' : 'Copy email address'}
      title={copied ? 'Copied' : 'Copy email'}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-pill hover:text-ink"
    >
      <Icon
        className={`h-3.5 w-3.5 ${copied ? 'text-brand' : ''}`}
        strokeWidth={1.8}
        aria-hidden="true"
      />
    </button>
  );
}
