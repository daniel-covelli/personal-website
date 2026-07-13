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
        faceClassName="h-11 w-11"
        duration={3200}
      >
        <img src="/robot.png" alt="" className="h-6 w-6 object-contain" />
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
