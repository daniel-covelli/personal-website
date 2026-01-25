'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/lib/chat';
import Message from './Message';

interface MessageListProps {
  messages: ChatMessage[];
  streamingId: string | null;
  personName: string;
}

export default function MessageList({ messages, streamingId, personName }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">Welcome!</p>
          <p>Ask me anything about {personName}&apos;s experience, skills, or projects.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          isStreaming={message.id === streamingId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
