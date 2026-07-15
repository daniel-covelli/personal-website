'use client';

import { ChatMessage } from '@/lib/types';
import { useTypewriter } from '@/lib/useTypewriter';
import Markdown from './Markdown';
import BloomSpinner from './BloomSpinner';

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  /** Show the leading (@.@) agent mark beside assistant replies (expanded view only). */
  isExpanded?: boolean;
}

function AnimatedAssistantMessage({ content }: { content: string }) {
  const displayedText = useTypewriter(content);

  return <Markdown>{displayedText}</Markdown>;
}

export default function Message({ message, isExpanded = false }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isUser ? (
        <div
          className={`max-w-[80%] rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      ) : message.content === '' ? (
        <div className="px-3 py-2">
          <BloomSpinner />
        </div>
      ) : (
        <div className="relative flex items-start">
          {isExpanded && (
            <span
              aria-hidden="true"
              className="absolute right-full top-1 mr-2.5 flex h-8 w-8 select-none items-center justify-center rounded-full bg-[linear-gradient(125deg,#7c3aed_0%,#6366f1_55%,#4f46e5_100%)] font-mono text-[10px] font-semibold leading-none tracking-tight text-white shadow-sm dark:bg-[linear-gradient(125deg,#db2777_0%,#7c3aed_50%,#4f46e5_100%)]"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.28)' }}
            >
              (@.@)
            </span>
          )}
          <div className="max-w-[80%] rounded-2xl bg-chip px-4 py-2 text-sm text-ink">
            {message.skipAnimation ? (
              <Markdown>{message.content}</Markdown>
            ) : (
              <AnimatedAssistantMessage content={message.content} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
