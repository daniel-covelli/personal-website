'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChatMessage } from '@/lib/chat';
import { useScrollLock } from '@/lib/useScrollLock';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatModalProps {
  personName: string;
  onClose: () => void;
}

export default function ChatModal({ personName, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useScrollLock(true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };

    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setStreamingId(assistantId);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: msg.content + parsed.text }
                      : msg
                  )
                );
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
    } finally {
      setIsLoading(false);
      setStreamingId(null);
    }
  }, [messages]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />

      {/* Chat window */}
      <div className="relative w-full max-w-md h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="font-semibold text-gray-900">Chat with {personName}</h2>
            <p className="text-xs text-gray-500">Ask about experience, skills, projects</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <MessageList messages={messages} streamingId={streamingId} personName={personName} />
        <MessageInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
