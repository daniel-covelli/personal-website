'use client';

import { ChatMessage } from '@/lib/chat';
import { useTypewriter } from '@/lib/useTypewriter';
import { LABS } from './labs';
import Markdown from './Markdown';
import { Orbit } from 'ldrs/react';
import 'ldrs/react/Orbit.css';

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

function AnimatedAssistantMessage({ content }: { content: string }) {
  const displayedText = useTypewriter(content);

  return <Markdown>{displayedText}</Markdown>;
}

// Small "answered by <Lab> <label>" tag shown under an assistant reply when we
// know which model produced it — the honest-disclosure half of the picker's
// fall-back behavior.
function Attribution({
  answeredBy,
}: {
  answeredBy: ChatMessage['answeredBy'];
}) {
  if (!answeredBy) return null;
  const lab = LABS[answeredBy.lab];
  return (
    <div className="flex items-center gap-1 pl-1 text-[10px] text-gray-400">
      {lab && (
        <span style={{ color: lab.color }}>
          <lab.Logo className="h-3 w-3" />
        </span>
      )}
      <span>answered by {answeredBy.label}</span>
    </div>
  );
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isUser ? (
        <div
          className={`max-w-[80%] rounded-2xl bg-brand-solid px-4 py-2 text-sm text-white`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      ) : message.content === '' ? (
        <div className="px-3 py-2">
          <Orbit size={25} speed={1.5} color="gray" />
        </div>
      ) : (
        <div className="flex max-w-[80%] flex-col gap-1">
          <div className="rounded-2xl bg-chip px-4 py-2 text-sm text-ink">
            {message.skipAnimation ? (
              <Markdown>{message.content}</Markdown>
            ) : (
              <AnimatedAssistantMessage content={message.content} />
            )}
          </div>
          <Attribution answeredBy={message.answeredBy} />
        </div>
      )}
    </div>
  );
}
