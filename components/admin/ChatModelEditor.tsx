'use client';

import { useState } from 'react';
import type { ChatModelEntry, Provider, Lab } from '@/lib/models/catalog';
import { LABS } from '@/components/chat/labs';

const PROVIDERS: Provider[] = [
  'anthropic',
  'openai',
  'google',
  'groq',
  'together',
];
const LAB_KEYS = Object.keys(LABS) as Lab[];

interface ChatModelEditorProps {
  initialModels: ChatModelEntry[];
}

export default function ChatModelEditor({
  initialModels,
}: ChatModelEditorProps) {
  const [models, setModels] = useState<ChatModelEntry[]>(initialModels);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function update<K extends keyof ChatModelEntry>(
    index: number,
    field: K,
    value: ChatModelEntry[K]
  ) {
    const next = [...models];
    next[index] = { ...next[index], [field]: value };
    setModels(next);
  }

  function addModel() {
    setModels([
      ...models,
      {
        id: `new-${Date.now()}`,
        provider: 'anthropic',
        lab: 'anthropic',
        modelId: '',
        label: '',
        enabled: false,
        userSelectable: false,
        sortOrder: models.length,
      },
    ]);
  }

  function removeModel(index: number) {
    setModels(models.filter((_, i) => i !== index));
  }

  function move(index: number, direction: 'up' | 'down') {
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
      const payload = models
        .filter((m) => m.modelId.trim().length > 0)
        .map((m) => ({
          provider: m.provider,
          lab: m.lab,
          modelId: m.modelId.trim(),
          label: m.label.trim() || m.modelId.trim(),
          enabled: m.enabled,
          userSelectable: m.userSelectable,
        }));
      const res = await fetch('/api/chat-models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: payload }),
      });
      setMessage(
        res.ok ? 'Models saved successfully!' : 'Failed to save models'
      );
    } catch {
      setMessage('Error saving models');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  const pickerCount = models.filter(
    (m) => m.enabled && m.userSelectable
  ).length;

  return (
    <section className="mt-8 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Assistant Models</h3>
          <p className="mt-1 text-sm text-gray-500">
            The <strong>enabled</strong> models, top to bottom, are the fallback
            chain — the assistant tries each until one answers.{' '}
            <strong>Visitor-selectable</strong> models appear in the public
            picker.
          </p>
        </div>
        <button
          onClick={addModel}
          className="flex-shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Add Model
        </button>
      </div>

      {pickerCount > 0 && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          {pickerCount} model{pickerCount === 1 ? '' : 's'} will show in the
          public picker. Note: rate limiting (issue #22) should be in place
          before exposing a picker to anonymous visitors.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {models.map((m, index) => {
          const lab = LABS[m.lab];
          return (
            <div key={m.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {lab && <lab.Logo className="h-4 w-4" />}
                  <span>Model {index + 1}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => move(index, 'up')}
                      disabled={index === 0}
                      className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(index, 'down')}
                      disabled={index === models.length - 1}
                      className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeModel(index)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Display label
                  </label>
                  <input
                    type="text"
                    placeholder="Claude Haiku 4.5"
                    value={m.label}
                    onChange={(e) => update(index, 'label', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Model ID
                  </label>
                  <input
                    type="text"
                    placeholder="claude-haiku-4-5"
                    value={m.modelId}
                    onChange={(e) => update(index, 'modelId', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Provider (API + key)
                  </label>
                  <select
                    value={m.provider}
                    onChange={(e) =>
                      update(index, 'provider', e.target.value as Provider)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Lab (logo / brand)
                  </label>
                  <select
                    value={m.lab}
                    onChange={(e) =>
                      update(index, 'lab', e.target.value as Lab)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {LAB_KEYS.map((l) => (
                      <option key={l} value={l}>
                        {LABS[l].displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={(e) => update(index, 'enabled', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Enabled (in fallback chain)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={m.userSelectable}
                    onChange={(e) =>
                      update(index, 'userSelectable', e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Visitor-selectable (in picker)
                </label>
              </div>
            </div>
          );
        })}
      </div>

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
