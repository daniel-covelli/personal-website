import { useState, useEffect, useRef } from 'react';

export function useTypewriter(text: string) {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousTextRef = useRef('');
  const textRef = useRef(text);

  useEffect(() => {
    // Store previous text before updating
    const prevText = previousTextRef.current;
    const wasAppended = text.startsWith(prevText);
    
    // If text was completely replaced (not just appended), reset
    if (!wasAppended && prevText !== '') {
      setDisplayedText('');
      indexRef.current = 0;
    }
    
    // Update refs
    textRef.current = text;
    previousTextRef.current = text;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const typeNextChar = () => {
      const currentText = textRef.current;
      if (indexRef.current < currentText.length) {
        setDisplayedText(currentText.slice(0, indexRef.current + 1));
        indexRef.current += 1;
        timeoutRef.current = setTimeout(typeNextChar, 5);
      } else {
        timeoutRef.current = null;
      }
    };

    // Continue typing from where we left off (or start if reset)
    if (indexRef.current < text.length) {
      timeoutRef.current = setTimeout(typeNextChar, 5);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [text]);

  return displayedText;
}
