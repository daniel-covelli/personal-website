'use client';

import { ReactNode, useEffect, useState } from 'react';

interface PromptVariable {
  token: string;
  description: string;
}

interface PromptEditorProps {
  title: string;
  description: ReactNode;
  // ChatConfig field this editor persists (the PUT body key).
  field: 'systemPrompt' | 'greetingPrompt';
  initialPrompt: string;
  defaultPrompt: string;
  // `initialPrompt` pre-rendered server-side, so the preview paints instantly on
  // first expand without a round-trip.
  initialRenderedPrompt: string;
  variables: readonly PromptVariable[];
  previewDescription: string;
  saveLabel: string;
  rows?: number;
  // Only the system prompt needs resume data; warn if it references none. The
  // greeting inherits resume context from the system prompt, so it opts out.
  warnMissingResume?: boolean;
}

// Tokens that pull in resume data, for the "no resume referenced" warning.
const RESUME_VARS = [
  'resume',
  'experience',
  'education',
  'skills',
  'projects',
  'contact',
  'bio',
];

type Preview =
  | { status: 'ready'; text: string }
  | { status: 'loading'; text: string }
  | { status: 'error'; message: string };

export default function PromptEditor({
  title,
  description,
  field,
  initialPrompt,
  defaultPrompt,
  initialRenderedPrompt,
  variables,
  previewDescription,
  saveLabel,
  rows = 20,
  warnMissingResume = false,
}: PromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null
  );
  const [preview, setPreview] = useState<Preview>({
    status: 'ready',
    text: initialRenderedPrompt,
  });

  const isDefault = prompt.trim() === defaultPrompt.trim();
  const missingResume =
    warnMissingResume && !RESUME_VARS.some((v) => prompt.includes(v));

  // Live-preview the edited template, rendered server-side (debounced). The
  // unedited state reuses the server's first paint; the last render stays visible
  // while a newer one loads, and superseded requests are cancelled.
  useEffect(() => {
    if (prompt === initialPrompt) {
      setPreview({ status: 'ready', text: initialRenderedPrompt });
      return;
    }

    let cancelled = false;
    setPreview((p) => ({
      status: 'loading',
      text: p.status === 'error' ? '' : p.text,
    }));

    const handle = setTimeout(async () => {
      try {
        const res = await fetch('/api/chat-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: prompt }),
        });
        const data = (await res.json().catch(() => null)) as {
          rendered?: string;
          error?: string;
        } | null;
        if (cancelled) return;
        setPreview(
          res.ok && typeof data?.rendered === 'string'
            ? { status: 'ready', text: data.rendered }
            : {
                status: 'error',
                message: data?.error ?? 'Failed to render preview',
              }
        );
      } catch {
        if (!cancelled)
          setPreview({ status: 'error', message: 'Failed to render preview' });
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [prompt, initialPrompt, initialRenderedPrompt]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/chat-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: prompt }),
      });
      if (res.ok) {
        setMessage({ text: 'Saved', ok: true });
      } else {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setMessage({ text: data?.error ?? 'Failed to save', ok: false });
      }
    } catch {
      setMessage({ text: 'Error saving', ok: false });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 5000);
  }

  return (
    <section className="mt-8 rounded-lg border border-hair bg-panel p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-subtle">{description}</p>
        </div>
        <span
          className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            isDefault
              ? 'bg-chip text-subtle'
              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
          }`}
        >
          {isDefault ? 'Default' : 'Customized'}
        </span>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        spellCheck={false}
        rows={rows}
        className="mt-4 w-full rounded-lg border border-hair bg-panel px-3 py-2 font-mono text-sm leading-relaxed text-ink focus:ring-2 focus:ring-brand"
      />

      <div className="mt-3">
        <p className="text-xs font-medium text-subtle">Available variables</p>
        <ul className="mt-1 flex flex-col gap-y-1 text-xs text-subtle">
          {variables.map((p) => (
            <li key={p.token}>
              <code className="font-mono text-body">{p.token}</code> —{' '}
              {p.description}
            </li>
          ))}
        </ul>
      </div>

      {missingResume && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Heads up: this template doesn&rsquo;t reference any resume data (e.g.{' '}
          <code className="font-mono">{'{{ resume }}'}</code>), so the assistant
          won&rsquo;t receive any resume details.
        </p>
      )}

      <details className="group mt-4 rounded-lg border border-hair bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-medium text-body">
          <span>Live preview (rendered against your resume)</span>
          <span className="text-xs font-normal text-subtle">
            {preview.status === 'loading' ? (
              'Rendering…'
            ) : preview.status === 'error' ? (
              <span className="text-red-600 dark:text-red-400">Error</span>
            ) : (
              <>
                <span className="group-open:hidden">Show</span>
                <span className="hidden group-open:inline">Hide</span>
              </>
            )}
          </span>
        </summary>
        <div className="border-t border-hair px-4 py-3">
          <p className="mb-2 text-xs text-subtle">{previewDescription}</p>
          {preview.status === 'error' ? (
            <p className="rounded-md bg-red-50 px-3 py-2 font-mono text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {preview.message}
            </p>
          ) : (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md bg-panel p-3 font-mono text-xs leading-relaxed text-body ring-1 ring-inset ring-hair">
              {preview.text}
            </pre>
          )}
        </div>
      </details>

      <div className="mt-6 flex items-center gap-4 border-t border-hair pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand-solid px-6 py-2 text-white hover:bg-brand-solid-hover disabled:opacity-50"
        >
          {saving ? 'Saving...' : saveLabel}
        </button>
        <button
          onClick={() => setPrompt(defaultPrompt)}
          disabled={isDefault}
          className="text-sm text-body hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset to default
        </button>
        {message && (
          <span
            className={`text-sm ${
              message.ok
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {message.text}
          </span>
        )}
      </div>
    </section>
  );
}
