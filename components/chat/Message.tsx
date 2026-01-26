'use client';

import { ChatMessage } from '@/lib/chat';
import { useTypewriter } from '@/lib/useTypewriter';
import { Orbit } from 'ldrs/react';
import 'ldrs/react/Orbit.css';

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

function AssistantMessage({ content }: { content: string }) {
  const displayedText = useTypewriter(content);

  return <p className="whitespace-pre-wrap">{displayedText}</p>;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isUser ? (
        <div
          className={`max-w-[80%] rounded-2xl bg-blue-600 px-4 py-2 text-white`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      ) : message.content === '' ? (
        <div className="px-3 py-2">
          <Orbit size={25} speed={1.5} color="gray" />
        </div>
      ) : (
        <div
          className={`max-w-[80%] rounded-2xl bg-gray-100 px-4 py-2 text-gray-900`}
        >
          <AssistantMessage content={message.content} />
        </div>
      )}
    </div>
  );
}
