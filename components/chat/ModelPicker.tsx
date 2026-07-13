'use client';

import { useEffect, useRef, useState } from 'react';
import type { Lab } from '@/lib/models/catalog';
import { LABS } from './labs';

export interface SelectableModel {
  modelId: string;
  label: string;
  lab: Lab;
}

interface ModelPickerProps {
  models: SelectableModel[];
  /** Selected modelId, or null for "let the site decide" (default chain). */
  value: string | null;
  onChange: (modelId: string | null) => void;
}

function LabMark({ lab, className }: { lab: Lab; className?: string }) {
  const info = LABS[lab];
  if (!info) return null;
  return (
    <span style={{ color: info.color }} className="inline-flex">
      <info.Logo className={className} />
    </span>
  );
}

export default function ModelPicker({
  models,
  value,
  onChange,
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selected = models.find((m) => m.modelId === value) ?? null;

  function choose(modelId: string | null) {
    onChange(modelId);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
        title="Choose the model"
      >
        {selected ? (
          <LabMark lab={selected.lab} className="h-3.5 w-3.5" />
        ) : null}
        <span className="max-w-[8rem] truncate">
          {selected ? selected.label : 'Auto'}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5 text-gray-400"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-60 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => choose(null)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-50"
          >
            <span className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate text-gray-700">
              Auto (recommended)
            </span>
            {value === null && <Check />}
          </button>
          {models.map((m) => (
            <button
              key={m.modelId}
              type="button"
              onClick={() => choose(m.modelId)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-50"
            >
              <LabMark lab={m.lab} className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 truncate text-gray-700">{m.label}</span>
              <span className="text-[10px] text-gray-400">
                {LABS[m.lab]?.displayName}
              </span>
              {value === m.modelId && <Check />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Check() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 flex-shrink-0 text-blue-600"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.79 6.8-6.79a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
