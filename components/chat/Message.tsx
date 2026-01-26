'use client';

import { ChatMessage } from '@/lib/chat';
import { useTypewriter } from '@/lib/useTypewriter';

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

function AssistantMessage({ content }: { content: string }) {
  const displayedText = useTypewriter(content);

  return (
    <p className="whitespace-pre-wrap">
      {displayedText}
    </p>
  );
}

export default function Message({ message }: MessageProps) {
  console.log(message);
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <AssistantMessage content={message.content} />
        )}
      </div>
    </div>
  );
}
