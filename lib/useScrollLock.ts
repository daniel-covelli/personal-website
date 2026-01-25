import { useEffect } from 'react';

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Store original styles
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Apply scroll lock
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    // Compensate all fixed elements
    const fixedElements = document.querySelectorAll<HTMLElement>('[data-scroll-lock-compensate]');
    fixedElements.forEach((el) => {
      el.dataset.originalPaddingRight = el.style.paddingRight;
      el.style.paddingRight = `${scrollbarWidth}px`;
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;

      fixedElements.forEach((el) => {
        el.style.paddingRight = el.dataset.originalPaddingRight || '';
        delete el.dataset.originalPaddingRight;
      });
    };
  }, [locked]);
}
