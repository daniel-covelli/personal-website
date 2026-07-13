'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/lib/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import Message from './Message';

interface MessageListProps {
  messages: ChatMessage[];
  streamingId: string | null;
  personName: string;
  isLoadingHistory?: boolean;
  isExpanded?: boolean;
}

export default function MessageList({
  messages,
  streamingId,
  personName,
  isLoadingHistory = false,
  isExpanded = false,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoadingHistory) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center text-subtle">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-hair border-t-brand" />
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center text-subtle">
          <p className="mb-2 text-lg">Welcome!</p>
          <p>
            Ask me anything about {personName}&apos;s experience, skills, or
            projects.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className={`space-y-4 p-4 ${isExpanded ? 'mx-auto max-w-3xl' : ''}`}>
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            isStreaming={message.id === streamingId}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
