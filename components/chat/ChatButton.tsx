'use client';

import { useState, useRef, useEffect } from 'react';
import ChatModal from './ChatModal';
import { RemoveScroll } from 'react-remove-scroll';
import { MovingBorderButton } from '@/components/ui/moving-border-button';
import { subscribeOpenChat } from '@/lib/chatLauncher';

interface ChatButtonProps {
  personName: string;
  isAdmin?: boolean;
}

export default function ChatButton({ personName, isAdmin }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [eyesClosed, setEyesClosed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Let the hero CTA (or anything) open the chat, optionally straight into the
  // expanded view.
  useEffect(
    () =>
      subscribeOpenChat(({ expanded = false }) => {
        setIsExpanded(expanded);
        setIsOpen(true);
      }),
    []
  );

  // Every few seconds the launcher face blinks: (@.@) -> (-.-) for a beat.
  // Honors reduced-motion by staying wide-eyed.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let openTimer: ReturnType<typeof setTimeout>;
    let closeTimer: ReturnType<typeof setTimeout>;
    const blink = () => {
      setEyesClosed(true);
      closeTimer = setTimeout(() => {
        setEyesClosed(false);
        openTimer = setTimeout(blink, 3500 + Math.random() * 4000);
      }, 150);
    };
    openTimer = setTimeout(blink, 3500 + Math.random() * 4000);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  return (
    <>
      <MovingBorderButton
        ref={buttonRef}
        onClick={() => {
          setIsExpanded(false);
          setIsOpen(true);
        }}
        aria-label="Open chat"
        containerClassName="fixed bottom-6 right-6 z-40"
        faceClassName="h-9 w-9"
        duration={3200}
      >
        <span
          aria-hidden="true"
          className="select-none font-mono text-[11px] font-semibold leading-none tracking-tight text-white"
        >
          {eyesClosed ? '(-.-)' : '(@.@)'}
        </span>
      </MovingBorderButton>

      {isOpen && buttonRef.current && (
        <RemoveScroll forwardProps={false}>
          <ChatModal
            personName={personName}
            onClose={() => setIsOpen(false)}
            buttonElement={buttonRef.current}
            isAdmin={isAdmin}
            isExpanded={isExpanded}
            onExpandedChange={setIsExpanded}
          />
        </RemoveScroll>
      )}
    </>
  );
}
