'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

interface TranscriptMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface TranscriptDialogProps {
  // null = closed.
  conversationId: string | null;
  // One-line context for the header, e.g. "San Francisco, CA, US · 2:47 PM".
  context: string;
  onClose: () => void;
}

type TranscriptState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'gone' }
  | { status: 'ready'; messages: TranscriptMessage[] };

// Read-only transcript viewer for the Analytics tab. Fetches on demand (the
// day payload carries only message counts) and caches per conversation id.
export default function TranscriptDialog({
  conversationId,
  context,
  onClose,
}: TranscriptDialogProps) {
  const [state, setState] = useState<TranscriptState>({ status: 'loading' });
  const cacheRef = useRef(new Map<string, TranscriptMessage[]>());

  useEffect(() => {
    if (!conversationId) return;
    const cached = cacheRef.current.get(conversationId);
    if (cached) {
      setState({ status: 'ready', messages: cached });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    fetch(`/api/analytics/conversations/${conversationId}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setState({ status: 'gone' });
          return;
        }
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = (await res.json()) as {
          conversation: { messages: TranscriptMessage[] };
        };
        cacheRef.current.set(conversationId, json.conversation.messages);
        if (!cancelled) {
          setState({ status: 'ready', messages: json.conversation.messages });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  return (
    <Dialog
      open={conversationId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex max-h-[80vh] max-w-xl flex-col gap-0 bg-panel p-0">
        <DialogHeader className="border-b border-hair px-5 py-4">
          <DialogTitle className="text-sm font-semibold text-ink">
            Conversation
          </DialogTitle>
          <DialogDescription className="text-[11px] text-subtle">
            {context}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 overflow-y-auto px-5 py-4">
          {state.status === 'loading' && (
            <div className="flex justify-center py-8 text-subtle">
              <Spinner className="h-5 w-5" label="Loading transcript" />
            </div>
          )}
          {state.status === 'error' && (
            <p className="py-8 text-center text-sm text-subtle">
              Failed to load this conversation. Close and try again.
            </p>
          )}
          {state.status === 'gone' && (
            <p className="py-8 text-center text-sm text-subtle">
              This conversation was purged (transcripts are kept for 30 days).
            </p>
          )}
          {state.status === 'ready' &&
            state.messages.map((m) => {
              const isVisitor = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    isVisitor
                      ? 'self-end bg-chip'
                      : 'self-start bg-blue-50 dark:bg-blue-950/40'
                  }`}
                >
                  <div className="mb-0.5 text-[10px] uppercase tracking-wide text-subtle">
                    {isVisitor ? 'Visitor' : 'Agent'}
                  </div>
                  <div className="whitespace-pre-wrap text-[13px] text-ink">
                    {m.content}
                  </div>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
