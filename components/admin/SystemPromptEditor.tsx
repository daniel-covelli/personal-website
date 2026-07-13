'use client';

import { useState } from 'react';
import { SYSTEM_PROMPT_VARIABLES } from '@/lib/chat-template';

interface SystemPromptEditorProps {
  // The template currently in effect (the saved override, or the built-in
  // default when nothing is saved).
  initialPrompt: string;
  // The built-in default template, used by the "Reset to default" action and to
  // show whether the current prompt is default or customized.
  defaultPrompt: string;
}

// Variable names that pull in resume data. Used only to warn when a template
// references none of them (see below) — the assistant would then have no resume
// context at all.
const RESUME_VARS = [
  'resume',
  'experience',
  'education',
  'skills',
  'projects',
  'contact',
  'bio',
];

export default function SystemPromptEditor({
  initialPrompt,
  defaultPrompt,
}: SystemPromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const isDefault = prompt.trim() === defaultPrompt.trim();
  const missingResume = !RESUME_VARS.some((v) => prompt.includes(v));

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/chat-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: prompt }),
      });

      if (res.ok) {
        setMessage('System prompt saved successfully!');
      } else {
        // Surface the server's reason (e.g. an invalid Liquid template) so the
        // admin can fix it rather than guess.
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setMessage(data?.error ?? 'Failed to save system prompt');
      }
    } catch {
      setMessage('Error saving system prompt');
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 5000);
  }

  return (
    <section className="mt-8 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">System Prompt</h3>
          <p className="mt-1 text-sm text-gray-500">
            Controls how the chat assistant behaves. This is a{' '}
            <a
              href="https://liquidjs.com/tutorials/intro-to-liquid.html"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              Liquid
            </a>{' '}
            template — your resume is injected as variables when the assistant
            runs, so it always reflects the latest Resume tab content. Drop in{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">
              {'{{ resume }}'}
            </code>{' '}
            for the whole resume, or loop over the individual sections.
          </p>
        </div>
        <span
          className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            isDefault ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'
          }`}
        >
          {isDefault ? 'Default' : 'Customized'}
        </span>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        spellCheck={false}
        rows={20}
        className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500"
      />

      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500">Available variables</p>
        <ul className="mt-1 flex flex-col gap-y-1 text-xs text-gray-400">
          {SYSTEM_PROMPT_VARIABLES.map((p) => (
            <li key={p.token}>
              <code className="font-mono text-gray-600">{p.token}</code> —{' '}
              {p.description}
            </li>
          ))}
        </ul>
      </div>

      {missingResume && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Heads up: this template doesn&rsquo;t reference any resume data (e.g.{' '}
          <code className="font-mono">{'{{ resume }}'}</code>), so the assistant
          won&rsquo;t receive any resume details.
        </p>
      )}

      <div className="mt-6 flex items-center gap-4 border-t border-gray-200 pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save System Prompt'}
        </button>
        <button
          onClick={() => setPrompt(defaultPrompt)}
          disabled={isDefault}
          className="text-sm text-gray-600 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset to default
        </button>
        {message && (
          <span
            className={`text-sm ${
              message.includes('success') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </section>
  );
}
