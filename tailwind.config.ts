import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Site palette ("Slate & Dusty Blue") — backed by CSS vars in
        // globals.css that flip under .dark. Alpha placeholder enables
        // opacity modifiers like bg-surface/80.
        surface: 'rgb(var(--surface) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        body: 'rgb(var(--body) / <alpha-value>)',
        subtle: 'rgb(var(--subtle) / <alpha-value>)',
        hair: 'rgb(var(--hair) / <alpha-value>)',
        rail: 'rgb(var(--rail) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          strong: 'rgb(var(--brand-strong) / <alpha-value>)',
          solid: 'rgb(var(--brand-solid) / <alpha-value>)',
          'solid-hover': 'rgb(var(--brand-solid-hover) / <alpha-value>)',
        },
        pill: {
          DEFAULT: 'rgb(var(--pill-bg) / <alpha-value>)',
          fg: 'rgb(var(--pill-fg) / <alpha-value>)',
        },
        chip: {
          DEFAULT: 'rgb(var(--chip-bg) / <alpha-value>)',
          fg: 'rgb(var(--chip-fg) / <alpha-value>)',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // Aurora: a soft, layered card lift (larger + gentler than shadow-sm).
        soft: '0 1px 2px rgb(20 30 50 / 0.05), 0 18px 36px -22px rgb(30 50 80 / 0.28)',
      },
      fontFamily: {
        // The "field data" face: Geist Mono (loaded in app/layout.tsx, exposed
        // as --font-geist-mono). Used for logged metadata like the Field Notes
        // ticker. Kept separate from `font-mono` so code blocks stay untouched.
        data: [
          'var(--font-geist-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      keyframes: {
        // Field Notes marquee: the track holds two identical halves, so sliding
        // it exactly -50% lands seamlessly back at the start.
        'field-notes': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        // Lap time is set per-instance via the --fn-duration custom property so
        // the glide speed stays constant as the number of notes changes.
        'field-notes': 'field-notes var(--fn-duration, 42s) linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
