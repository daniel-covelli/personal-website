'use client';

import { useState, useRef } from 'react';
import ChatModal from './ChatModal';
import { RemoveScroll } from 'react-remove-scroll';

interface ChatButtonProps {
  personName: string;
}

export default function ChatButton({ personName }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-700"
        aria-label="Open chat"
      >
        <img src="/robot.png" alt="Robot" className="h-6 w-6 object-contain" />
      </button>

      {isOpen && buttonRef.current && (
        <RemoveScroll forwardProps={false}>
          <ChatModal
            personName={personName}
            onClose={() => setIsOpen(false)}
            buttonElement={buttonRef.current}
          />
        </RemoveScroll>
      )}
    </>
  );
}
