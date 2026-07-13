import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import Mermaid from './Mermaid';

/**
 * Full-article Markdown renderer (distinct from the chat's compact
 * components/chat/Markdown). Adds, on top of GFM:
 *   - syntax-highlighted fenced code (rehype-highlight; theme in globals.css)
 *   - ```mermaid blocks rendered to SVG (client-side <Mermaid>)
 *   - styled images, tables, and block quotes
 *
 * Rendered on the server so article bodies are in the initial HTML (SEO);
 * only the mermaid diagrams hydrate on the client. Colors use the site's
 * semantic tokens so both themes work without `dark:` variants.
 */

// Flatten arbitrary React children to plain text — used to recover the raw
// source of a mermaid block, whose children may be a string or (for other
// languages) highlight.js token spans.
function childrenToText(children: React.ReactNode): string {
  if (children == null) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join('');
  if (React.isValidElement(children)) {
    return childrenToText(
      (children.props as { children?: React.ReactNode }).children
    );
  }
  return '';
}

const components: Components = {
  h1: (props) => (
    <h1
      className="mb-4 mt-10 text-2xl font-bold tracking-[-0.01em] text-ink"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="mb-3 mt-10 border-b border-hair pb-2 text-xl font-bold tracking-[-0.01em] text-ink"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="mb-2 mt-8 text-lg font-semibold text-ink" {...props} />
  ),
  h4: (props) => (
    <h4 className="mb-2 mt-6 text-base font-semibold text-ink" {...props} />
  ),
  p: ({ node, children, ...props }) => {
    // A lone image renders as its own <figure> (a block element). Markdown wraps
    // a standalone image in a paragraph, and <figure> can't legally nest inside
    // <p> (hydration error), so unwrap the paragraph in that case.
    const kids = node?.children ?? [];
    const elementKids = kids.filter((k) => k.type === 'element');
    const isLoneImage =
      elementKids.length === 1 &&
      elementKids[0].type === 'element' &&
      elementKids[0].tagName === 'img' &&
      kids.every(
        (k) =>
          k.type === 'element' || (k.type === 'text' && k.value.trim() === '')
      );
    if (isLoneImage) return <>{children}</>;
    return (
      <p className="my-4 leading-[1.75] text-body" {...props}>
        {children}
      </p>
    );
  },
  a: (props) => (
    <a
      className="text-brand underline underline-offset-2 hover:text-brand-strong"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: (props) => (
    <ul className="my-4 list-disc space-y-2 pl-6 text-body" {...props} />
  ),
  ol: (props) => (
    <ol className="my-4 list-decimal space-y-2 pl-6 text-body" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="my-6 border-l-2 border-brand/60 pl-4 italic text-subtle"
      {...props}
    />
  ),
  hr: () => <hr className="my-8 border-hair" />,
  strong: (props) => <strong className="font-semibold text-ink" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  img: ({ src, alt }) => (
    <figure className="my-6">
      {/* eslint-disable-next-line @next/next/no-img-element -- article bodies
          embed arbitrary external image URLs; next/image needs known dims. */}
      <img
        src={typeof src === 'string' ? src : ''}
        alt={alt ?? ''}
        loading="lazy"
        className="mx-auto max-w-full rounded-lg border border-hair shadow-soft"
      />
      {alt ? (
        <figcaption className="mt-2 text-center text-sm text-subtle">
          {alt}
        </figcaption>
      ) : null}
    </figure>
  ),
  table: (props) => (
    <div className="my-6 overflow-x-auto">
      <table
        className="w-full border-collapse text-sm text-body"
        {...props}
      />
    </div>
  ),
  thead: (props) => <thead className="border-b border-hair" {...props} />,
  th: (props) => (
    <th
      className="px-3 py-2 text-left font-semibold text-ink"
      {...props}
    />
  ),
  td: (props) => (
    <td className="border-b border-hair px-3 py-2 align-top" {...props} />
  ),
  // Let the block styling live on <code>; pass <pre> through so we don't
  // double-wrap fenced blocks.
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }) => {
    const lang = /language-(\w+)/.exec(className ?? '')?.[1];

    if (lang === 'mermaid') {
      return <Mermaid chart={childrenToText(children)} />;
    }

    const isBlock =
      /language-/.test(className ?? '') || childrenToText(children).includes('\n');

    if (isBlock) {
      return (
        <div className="my-6 overflow-hidden rounded-lg border border-hair">
          {lang ? (
            <div className="border-b border-hair bg-panel px-4 py-1.5 font-mono text-xs text-subtle">
              {lang}
            </div>
          ) : null}
          <pre className="overflow-x-auto bg-panel p-4 text-[0.8rem] leading-relaxed">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    }

    return (
      <code
        className="rounded bg-chip px-1.5 py-0.5 font-mono text-[0.85em] text-chip-fg"
        {...props}
      >
        {children}
      </code>
    );
  },
};

export default function ArticleMarkdown({ children }: { children: string }) {
  return (
    <div className="article-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { ignoreMissing: true, detect: false }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
