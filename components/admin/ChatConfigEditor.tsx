'use client';

import { useState } from 'react';

interface ChatConfigEditorProps {
  initialModels: string[];
}

// Shown as a hint so the admin knows valid, current model IDs to type.
const KNOWN_MODELS = ['claude-haiku-4-5', 'claude-sonnet-5', 'claude-opus-4-8'];

export default function ChatConfigEditor({
  initialModels,
}: ChatConfigEditorProps) {
  const [models, setModels] = useState<string[]>(
    initialModels.length > 0 ? initialModels : ['']
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function updateModel(index: number, value: string) {
    const next = [...models];
    next[index] = value;
    setModels(next);
  }

  function addModel() {
    setModels([...models, '']);
  }

  function removeModel(index: number) {
    const next = models.filter((_, i) => i !== index);
    setModels(next.length > 0 ? next : ['']);
  }

  function moveModel(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= models.length) return;
    const next = [...models];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setModels(next);
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      const cleaned = models.map((m) => m.trim()).filter((m) => m.length > 0);
      const res = await fetch('/api/chat-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: cleaned }),
      });

      if (res.ok) {
        setModels(cleaned.length > 0 ? cleaned : ['']);
        setMessage('Assistant models saved successfully!');
      } else {
        setMessage('Failed to save assistant models');
      }
    } catch {
      setMessage('Error saving assistant models');
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  return (
    <section className="mt-8 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Assistant Models</h3>
      <p className="mt-1 text-sm text-gray-500">
        The chat assistant tries these models in order. If one is retired or
        errors, it automatically falls back to the next — the first is the
        primary. Leave the list empty to use the built-in defaults.
      </p>

      <div className="mt-4 space-y-2">
        {models.map((model, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-20 flex-shrink-0 text-sm text-gray-500">
              {index === 0 ? 'Primary' : `Fallback ${index}`}
            </span>
            <input
              type="text"
              placeholder="e.g. claude-haiku-4-5"
              value={model}
              onChange={(e) => updateModel(index, e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-1">
              <button
                onClick={() => moveModel(index, 'up')}
                disabled={index === 0}
                className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => moveModel(index, 'down')}
                disabled={index === models.length - 1}
                className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => removeModel(index)}
                className="rounded px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addModel}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add fallback model
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Known current model IDs: {KNOWN_MODELS.join(', ')}
      </p>

      <div className="mt-6 border-t border-gray-200 pt-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Models'}
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
      </div>
    </section>
  );
}
