'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders assistant messages as Markdown. The model frequently replies with
 * bold text, bullet lists and headings; without this they showed up as raw
 * `**` / `-` characters (issue #20).
 *
 * Tailwind's preflight zeroes element margins and list styles, so every tag we
 * care about is restyled explicitly here (block spacing comes from the wrapper
 * `space-y-2`). Colors use the site's semantic tokens so it works in both
 * themes with no `dark:` variants. `remark-gfm` adds tables, strikethrough and
 * autolinks on top of CommonMark.
 */
const components: Components = {
  strong: (props) => <strong className="font-semibold text-ink" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  ul: (props) => <ul className="list-disc space-y-1 pl-5" {...props} />,
  ol: (props) => <ol className="list-decimal space-y-1 pl-5" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  h1: (props) => <h1 className="text-base font-semibold text-ink" {...props} />,
  h2: (props) => <h2 className="text-base font-semibold text-ink" {...props} />,
  h3: (props) => <h3 className="text-sm font-semibold text-ink" {...props} />,
  a: (props) => (
    <a
      className="text-brand underline underline-offset-2 hover:text-brand-strong"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-l-2 border-hair pl-3 text-subtle"
      {...props}
    />
  ),
  hr: (props) => <hr className="border-hair" {...props} />,
  // Fenced blocks (`language-*`) sit inside <pre>, which owns the box; bare
  // inline code gets its own chip.
  code: ({ className, children, ...props }) =>
    /language-/.test(className ?? '') ? (
      <code className={className} {...props}>
        {children}
      </code>
    ) : (
      <code
        className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/10"
        {...props}
      >
        {children}
      </code>
    ),
  pre: (props) => (
    <pre
      className="overflow-x-auto rounded-lg bg-black/10 p-3 text-xs dark:bg-white/10"
      {...props}
    />
  ),
};

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
