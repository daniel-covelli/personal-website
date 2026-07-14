import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Geist Mono (variable weight) — the monospaced "data" face for logged metadata
// such as the Field Notes ticker. Exposed as a CSS variable and wired to the
// `font-data` Tailwind utility; body copy stays Inter.
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Daniel Covelli - Software Engineer',
  description: 'Personal website and resume for Daniel Covelli',
};

// Runs before first paint to set the theme class on <html>, so returning
// visitors never flash the wrong theme. The home page and article pages are
// themed — the print/PDF routes and admin pages stay light. An explicit toggle
// (`theme`) wins; otherwise we use the last sun-based result (`theme-auto`),
// falling back to a local-time guess that ThemeProvider later refines via
// geolocation.
const themeScript = `
(function () {
  try {
    var p = location.pathname;
    if (p !== '/' && p.indexOf('/articles') !== 0) return;
    var override = localStorage.getItem('theme');
    var theme;
    if (override === 'light' || override === 'dark') {
      theme = override;
    } else {
      var cached = localStorage.getItem('theme-auto');
      if (cached === 'light' || cached === 'dark') {
        theme = cached;
      } else {
        var h = new Date().getHours();
        theme = h >= 7 && h < 19 ? 'light' : 'dark';
      }
    }
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.className} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
