'use client';

import {
  useState,
  useCallback,
  useLayoutEffect,
  useRef,
  useEffect,
} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChatMessage } from '@/lib/types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

// Give up on a stalled request instead of spinning forever.
const CHAT_TIMEOUT_MS = 30000;

/**
 * A user-presentable chat failure. `retryable` distinguishes transient
 * failures (e.g. a timeout) — where the input should stay open so the user can
 * try again — from fatal ones (e.g. the assistant being unavailable), where the
 * input is disabled.
 */
class ChatError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'ChatError';
    this.retryable = retryable;
  }
}

/**
 * Normalize a thrown value into the error banner shape. Only `ChatError`s
 * declare themselves retryable; anything else is treated as fatal.
 */
function toErrorState(
  err: unknown,
  fallback: string
): { message: string; retryable: boolean } {
  if (err instanceof ChatError) {
    return { message: err.message, retryable: err.retryable };
  }
  return {
    message: err instanceof Error ? err.message : fallback,
    retryable: false,
  };
}

interface StreamHandlers {
  onConversationId?: (id: string) => void;
  onText: (text: string) => void;
}

/**
 * POSTs to /api/chat and consumes the SSE stream. Resolves when the stream
 * completes; throws a user-presentable Error on HTTP failure, a server-sent
 * `{ error }` event, or a timeout — so callers can always stop the spinner and
 * show something. Buffers across reads because SSE events can split across
 * chunk boundaries.
 */
async function streamAssistant(
  body: unknown,
  { onConversationId, onText }: StreamHandlers
): Promise<void> {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), CHAT_TIMEOUT_MS);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abort.signal,
    });

    if (!response.ok) {
      throw new ChatError('The assistant is unavailable right now.', false);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new ChatError('No response stream', false);

    const decoder = new TextDecoder();
    let buffer = '';
    let done = false;

    while (!done) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;

      buffer += decoder.decode(value, { stream: true });

      // Process only complete `\n\n`-delimited SSE events.
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        for (const line of rawEvent.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') {
            done = true;
            break;
          }

          let parsed: {
            conversationId?: string;
            text?: string;
            error?: string;
          };
          try {
            parsed = JSON.parse(data);
          } catch {
            continue; // incomplete/invalid JSON fragment — skip
          }

          if (parsed.error) throw new Error(parsed.error);
          if (parsed.conversationId) onConversationId?.(parsed.conversationId);
          if (parsed.text) onText(parsed.text);
        }
        if (done) break;
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ChatError(
        'The assistant took too long to respond. Please try again.',
        true
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

interface ChatModalProps {
  personName: string;
  onClose: () => void;
  buttonElement: HTMLButtonElement;
  isAdmin?: boolean;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export default function ChatModal({
  personName,
  onClose,
  buttonElement,
  isAdmin,
  isExpanded,
  onExpandedChange,
}: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<{
    message: string;
    retryable: boolean;
  } | null>(null);
  const [position, setPosition] = useState({ bottom: 0, right: 0 });
  const [isAnimating, setIsAnimating] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  // On mobile there is no docked/expanded duality — the chat is a single
  // fullscreen view, so the fly-out-from-button geometry doesn't apply.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640
  );
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

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
    setError(null);

    try {
      await streamAssistant(
        { messages: [], isGreeting: true },
        {
          onConversationId: setConversationId,
          onText: (text) =>
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: msg.content + text }
                  : msg
              )
            ),
        }
      );
    } catch (err) {
      console.error('Failed to get initial greeting:', err);
      setError(toErrorState(err, 'The assistant is unavailable right now.'));
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
    if (isMobile) {
      // Fullscreen — just fade/slide in, no geometry to compute.
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setIsAnimating(false))
      );
      return () => cancelAnimationFrame(raf);
    }

    if (!buttonElement) return;

    const buttonRect = buttonElement.getBoundingClientRect();
    const spacing = 16; // space between button and modal

    // Final position: above the button, aligned to its right edge
    const finalBottom = window.innerHeight - buttonRect.top + spacing;
    const finalRight = window.innerWidth - buttonRect.right;

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
  }, [buttonElement, isMobile]);

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
        await streamAssistant(
          {
            messages: [...messages, userMessage].map(({ role, content }) => ({
              role,
              content,
            })),
            conversationId,
          },
          {
            onConversationId: (id) => {
              if (!conversationId) setConversationId(id);
            },
            onText: (text) =>
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: msg.content + text }
                    : msg
                )
              ),
          }
        );
      } catch (err) {
        setError(toErrorState(err, 'Something went wrong'));
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
      } finally {
        setIsLoading(false);
        setStreamingId(null);
      }
    },
    [messages, conversationId]
  );

  // A fatal error replaces the conversation and locks the input; a retryable
  // one (e.g. a timeout) is shown above the conversation with the input left
  // open so the user can try again.
  const isFatalError = !!error && !error.retryable;
  const errorBanner = error ? (
    <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      {error.message}
    </div>
  ) : null;

  return (
    <DialogPrimitive.Root
      open={true}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogPrimitive.Portal>
        {/* Backdrop. Radix suppresses its own <Dialog.Overlay> when
            modal={false} (which we use so the docked chat leaves the page
            interactive), so we render our own. It only dims + blurs the page
            when expanded; docked it stays transparent and click-through. */}
        <div
          aria-hidden
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          className={`fixed inset-0 z-[60] transition-all duration-300 ${
            isExpanded
              ? 'bg-black/40 opacity-100 backdrop-blur-lg'
              : 'pointer-events-none bg-transparent opacity-0'
          }`}
        />

        {/* Chat window */}
        <DialogPrimitive.Content
          ref={contentRef}
          className={`fixed z-[70] flex flex-col overflow-hidden bg-panel outline-none transition-all [transition-duration:350ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
            isMobile
              ? ''
              : `rounded-2xl border border-hair shadow-soft ${
                  isExpanded ? '' : 'h-[600px] max-h-[80vh] w-full max-w-md'
                }`
          }`}
          style={
            isMobile
              ? {
                  // Single fullscreen view on mobile — covers the whole
                  // viewport (dvh so the on-screen keyboard resizes it).
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100vw',
                  height: '100dvh',
                  transform: isAnimating ? 'translateY(16px)' : 'translateY(0)',
                  opacity: isAnimating ? 0 : 1,
                }
              : isExpanded
              ? {
                  // Large centered panel floating over the blurred page. Kept off
                  // the edges (capped size + centered) so a margin of blurred
                  // background always shows around it. Positioned via right/bottom
                  // with top/left auto — the SAME model as the docked state — so
                  // expanding only interpolates numbers and stays smooth (no
                  // teleport). right/bottom resolve to the centering margin.
                  right: 'max(48px, calc((100vw - 1200px) / 2))',
                  bottom: 'max(48px, calc((100dvh - 920px) / 2))',
                  left: 'auto',
                  top: 'auto',
                  width: 'min(1200px, calc(100vw - 96px))',
                  height: 'min(920px, calc(100dvh - 96px))',
                  transformOrigin: 'bottom right',
                  transform: 'none',
                  opacity: 1,
                }
              : {
                  bottom: `${position.bottom}px`,
                  right: `${position.right}px`,
                  left: 'auto',
                  top: 'auto',
                  transformOrigin: 'bottom right',
                  transform: isAnimating
                    ? 'scale(0.9) translateY(10px)'
                    : 'scale(1) translateY(0)',
                  opacity: isAnimating ? 0 : 1,
                }
          }
          onEscapeKeyDown={(e) => {
            // When expanded, Escape collapses back to the docked panel instead
            // of closing the whole chat. On mobile there is no docked panel,
            // so Escape closes.
            if (isExpanded && !isMobile) {
              e.preventDefault();
              onExpandedChange(false);
            }
          }}
          onInteractOutside={(e) => {
            e.preventDefault();
            // Clicking outside always closes the chat — whether docked or
            // expanded. (Escape, by contrast, collapses an expanded panel.)
            onClose();
          }}
        >
          {/* Header — panel (not surface), so the top of the window stays
              distinct from the page background, which is also surface. */}
          <div className="flex items-center justify-end border-b border-hair bg-panel px-4 py-2">
            {/* Title kept for accessibility (Radix requires it) but hidden. */}
            <DialogPrimitive.Title className="sr-only">
              Chat with Daniel&apos;s agent
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              AI Assistant
            </DialogPrimitive.Description>
            <div className="flex items-center gap-1">
              {isAdmin && messages.length > 0 && (
                <button
                  onClick={handleDeleteConversation}
                  className="hidden p-1 text-subtle transition-colors hover:text-red-500 sm:block"
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
              <button
                onClick={() => onExpandedChange(!isExpanded)}
                className="hidden p-1 text-subtle transition-colors hover:text-ink sm:block"
                aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
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
                      d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
                    />
                  </svg>
                ) : (
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
                      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25-5.25h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15"
                    />
                  </svg>
                )}
              </button>
              <DialogPrimitive.Close
                className="p-1 text-subtle transition-colors hover:text-ink"
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </DialogPrimitive.Close>
            </div>
          </div>

          {isFatalError ? (
            <div className="flex flex-1 flex-col">{errorBanner}</div>
          ) : (
            <>
              {errorBanner}
              <MessageList
                messages={messages}
                streamingId={streamingId}
                personName={personName}
                isLoadingHistory={isLoadingHistory}
                isExpanded={isExpanded}
              />
            </>
          )}
          <MessageInput
            onSend={sendMessage}
            isLoading={isLoading}
            isExpanded={isExpanded}
            disabled={isFatalError}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
