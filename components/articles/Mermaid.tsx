'use client';

import { useEffect, useId, useState } from 'react';

/**
 * Renders a ```mermaid fenced block to SVG. Mermaid is heavy, so it's
 * dynamically imported on first paint. Theme is read straight off the <html>
 * `.dark` class (and watched with a MutationObserver) rather than the
 * ThemeProvider context, so this also works in the admin preview, which isn't
 * wrapped in that provider. If the diagram source is invalid we fall back to
 * showing the raw code instead of blowing up the page.
 */
export default function Mermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Track the site theme from the root element's class.
  useEffect(() => {
    const read = () =>
      setIsDark(document.documentElement.classList.contains('dark'));
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const source = chart.trim();
    if (!source) return;

    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isDark ? 'dark' : 'default',
          fontFamily: 'inherit',
        });
        const { svg } = await mermaid.render(id, source);
        if (!cancelled) {
          setSvg(svg);
          setError(false);
        }
      } catch (err) {
        console.error('Mermaid render failed:', err);
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, isDark, id]);

  if (error) {
    return (
      <pre className="my-6 overflow-x-auto rounded-lg border border-hair bg-panel p-4 text-xs text-subtle">
        <code>{chart}</code>
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 flex items-center justify-center rounded-lg border border-hair bg-panel px-4 py-10 text-sm text-subtle">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      className="my-6 flex justify-center overflow-x-auto rounded-lg border border-hair bg-panel p-4 [&_svg]:h-auto [&_svg]:max-w-full"
      // eslint-disable-next-line react/no-danger -- SVG is produced by mermaid
      // with securityLevel:'strict', which sanitizes the diagram source.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
