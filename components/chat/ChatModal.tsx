'use client';

import { useState, useCallback, useLayoutEffect, useRef, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChatMessage } from '@/lib/chat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatModalProps {
  personName: string;
  onClose: () => void;
  buttonElement: HTMLButtonElement;
  isAdmin?: boolean;
}

export default function ChatModal({ personName, onClose, buttonElement, isAdmin }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState({ bottom: 0, right: 0 });
  const [isAnimating, setIsAnimating] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const getInitialGreeting = useCallback(async () => {
    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };

    setMessages([assistantMessage]);
    setIsLoading(true);
    setStreamingId(assistantId);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          isGreeting: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get greeting');
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
              if (parsed.conversationId) {
                setConversationId(parsed.conversationId);
              }
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
      console.error('Failed to get initial greeting:', err);
      setMessages([]);
    } finally {
      setIsLoading(false);
      setStreamingId(null);
    }
  }, []);

  const handleDeleteConversation = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch('/api/conversations', {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages([]);
        setConversationId(null);
        // Get a fresh greeting after deletion
        await getInitialGreeting();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [getInitialGreeting]);

  // Load existing conversation on mount, or get initial greeting for new sessions
  useEffect(() => {
    async function loadConversation() {
      try {
        const response = await fetch('/api/conversations');
        if (response.ok) {
          const data = await response.json();
          if (data.conversation && data.conversation.messages.length > 0) {
            setConversationId(data.conversation.id);
            setMessages(
              data.conversation.messages.map(
                (m: { id: string; role: string; content: string }) => ({
                  id: m.id,
                  role: m.role as 'user' | 'assistant',
                  content: m.content,
                  skipAnimation: true,
                })
              )
            );
            setIsLoadingHistory(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load conversation:', err);
      }

      // No existing conversation - get initial greeting from LLM
      setIsLoadingHistory(false);
      await getInitialGreeting();
    }

    loadConversation();
  }, [getInitialGreeting]);

  useLayoutEffect(() => {
    if (!buttonElement) return;

    const buttonRect = buttonElement.getBoundingClientRect();
    const spacing = 16; // space between button and modal
    const isMobile = window.innerWidth < 640;

    // Calculate final position: above the button
    let finalBottom: number;
    let finalRight: number;

    if (isMobile) {
      // On mobile, position above button, centered horizontally with padding
      finalBottom = window.innerHeight - buttonRect.top + spacing;
      finalRight = 16; // p-4 = 16px padding
    } else {
      // On desktop, position above button aligned to right
      finalBottom = window.innerHeight - buttonRect.top + spacing;
      finalRight = window.innerWidth - buttonRect.right;
    }

    // Set initial position (at button location, centered on button)
    const initialBottom = window.innerHeight - buttonRect.bottom;
    const initialRight = window.innerWidth - buttonRect.right;

    setPosition({
      bottom: initialBottom,
      right: initialRight,
    });

    // Animate to final position after a brief delay to allow initial render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPosition({ bottom: finalBottom, right: finalRight });
        setIsAnimating(false);
      });
    });
  }, [buttonElement]);

  const sendMessage = useCallback(
    async (content: string) => {
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
            messages: [...messages, userMessage].map(({ role, content }) => ({
              role,
              content,
            })),
            conversationId,
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
                // Handle conversation ID from server
                if (parsed.conversationId && !conversationId) {
                  setConversationId(parsed.conversationId);
                }
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
    },
    [messages, conversationId]
  );

  return (
    <DialogPrimitive.Root open={true} modal={false} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={`fixed inset-0 z-50 bg-black/20 transition-opacity duration-300 ${
            isAnimating ? 'opacity-0' : 'opacity-100'
          }`}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
        />

        {/* Chat window */}
        <DialogPrimitive.Content
          ref={contentRef}
          className="fixed z-50 flex h-[600px] max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none transition-all duration-300 ease-out"
          style={{
            bottom: `${position.bottom}px`,
            right: `${position.right}px`,
            left: 'auto',
            top: 'auto',
            transformOrigin: 'bottom right',
            transform: isAnimating ? 'scale(0.9) translateY(10px)' : 'scale(1) translateY(0)',
            opacity: isAnimating ? 0 : 1,
          }}
          onInteractOutside={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
            <DialogPrimitive.Title className="font-semibold text-stone-900">
              Assistant
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              AI Assistant
            </DialogPrimitive.Description>
            <div className="flex items-center gap-1">
              {isAdmin && messages.length > 0 && (
                <button
                  onClick={handleDeleteConversation}
                  className="p-1 text-gray-400 transition-colors hover:text-red-600"
                  aria-label="Delete conversation"
                  title="Delete conversation"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              )}
              <DialogPrimitive.Close
                className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Close chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </DialogPrimitive.Close>
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <MessageList
            messages={messages}
            streamingId={streamingId}
            personName={personName}
            isLoadingHistory={isLoadingHistory}
          />
          <MessageInput onSend={sendMessage} isLoading={isLoading} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
