'use client';

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function MessageInput({ onSend, isLoading }: MessageInputProps) {
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
    if (input.trim() && !isLoading) {
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
    <form onSubmit={handleSubmit} className="border-t border-stone-200 p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none overflow-hidden rounded-xl border border-stone-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="rounded-xl bg-sky-500 px-4 py-2 text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {isLoading ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Send'
          )}
        </button>
      </div>
      <p className="mt-2 text-xs text-stone-400">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}
