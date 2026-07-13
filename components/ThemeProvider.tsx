'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { isSunUp } from '@/lib/solar';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Key set only when the user explicitly toggles — an override that wins over
// the sun-based default. `AUTO_KEY` caches the last sun-based result so return
// visits render the right theme before geolocation resolves (avoids a flash).
const OVERRIDE_KEY = 'theme';
const AUTO_KEY = 'theme-auto';

function applyClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// Fallback used before/without geolocation: the sun is roughly up during the
// day. Keep this in sync with the inline script in app/layout.tsx.
function localTimeGuess(): Theme {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Adopt whatever the pre-paint inline script already put on <html>.
    setTheme(
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );

    // An explicit user choice always wins — never auto-detect over it.
    const override = localStorage.getItem(OVERRIDE_KEY);
    if (override === 'light' || override === 'dark') return;

    let cancelled = false;
    const decide = (next: Theme) => {
      if (cancelled) return;
      localStorage.setItem(AUTO_KEY, next);
      applyClass(next);
      setTheme(next);
    };

    // Default follows the real sun position at the user's location. If they
    // deny permission or it's unavailable, fall back to the local-time guess.
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          decide(
            isSunUp(pos.coords.latitude, pos.coords.longitude)
              ? 'light'
              : 'dark'
          ),
        () => decide(localTimeGuess()),
        { timeout: 8000, maximumAge: 60 * 60 * 1000 }
      );
    } else {
      decide(localTimeGuess());
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(OVERRIDE_KEY, next);
      applyClass(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
