import { useState, useEffect, useRef } from 'react';

export function useTypewriter(text: string) {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousTextRef = useRef('');

  useEffect(() => {
    // If text was completely replaced (not just appended), reset
    if (!text.startsWith(previousTextRef.current)) {
      setDisplayedText('');
      indexRef.current = 0;
    }
    // Otherwise, text was appended - continue from current position
    // indexRef already points to where we are, so we just continue

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
        timeoutRef.current = setTimeout(typeNextChar, 5);
      }
    };

    // Continue typing from where we left off (or start if reset)
    timeoutRef.current = setTimeout(typeNextChar, 5);
    
    // Update previous text reference
    previousTextRef.current = text;
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text]);

  return displayedText;
}
