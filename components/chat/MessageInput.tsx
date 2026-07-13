'use client';

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { Spinner } from '@/components/ui/spinner';

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  isExpanded?: boolean;
  disabled?: boolean;
}

export default function MessageInput({
  onSend,
  isLoading,
  isExpanded = false,
  disabled = false,
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-hair px-4 py-3">
      <div className={isExpanded ? 'mx-auto w-full max-w-3xl' : ''}>
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="min-h-[36px] flex-1 resize-none overflow-hidden rounded-xl border border-hair bg-surface px-4 py-1.5 text-sm text-ink placeholder:text-subtle focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || disabled}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || disabled}
            className={`relative flex h-9 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition-all ${
              isLoading
                ? 'bg-violet-600'
                : 'bg-violet-600 hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700'
            }`}
          >
            {/* "Send" stays in the DOM (just hidden) while loading so the button
                keeps its exact size; the spinner is overlaid, centered. */}
            <span className={isLoading ? 'invisible' : ''}>Send</span>
            {isLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner className="h-5 w-5" label="Sending" />
              </span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
