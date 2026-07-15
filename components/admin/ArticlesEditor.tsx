'use client';

import { useEffect, useMemo, useState } from 'react';
import { Article, ArticleInput } from '@/lib/types';
import ArticleView, {
  ArticleViewData,
} from '@/components/articles/ArticleView';

interface ArticlesEditorProps {
  initialArticles: Article[];
}

interface EditorState {
  id: string | null; // null = new, unsaved
  title: string;
  slug: string;
  summary: string;
  body: string;
  headerImageUrl: string;
  tags: string; // comma-separated in the input
  published: boolean;
  publishedAt: string; // 'YYYY-MM-DD' or ''
}

// Client-side slug preview (mirrors lib/articles.slugify) — kept inline so this
// client component doesn't import the Prisma-backed data layer.
function previewSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function emptyState(): EditorState {
  return {
    id: null,
    title: '',
    slug: '',
    summary: '',
    body: '',
    headerImageUrl: '',
    tags: '',
    published: false,
    publishedAt: '',
  };
}

function articleToState(a: Article): EditorState {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    summary: a.summary,
    body: a.body,
    headerImageUrl: a.headerImageUrl,
    tags: a.tags.join(', '),
    published: a.published,
    publishedAt: a.publishedAt ? a.publishedAt.slice(0, 10) : '',
  };
}

function stateToInput(s: EditorState): ArticleInput {
  return {
    slug: s.slug.trim() || undefined,
    title: s.title.trim(),
    summary: s.summary.trim(),
    body: s.body,
    headerImageUrl: s.headerImageUrl.trim(),
    tags: s.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    published: s.published,
    publishedAt: s.publishedAt ? new Date(s.publishedAt).toISOString() : null,
  };
}

// Map the in-progress form to the shape ArticleView renders, so the live
// preview is byte-for-byte the reader's end-state. Empty title/body get gentle
// placeholders so the preview never looks broken mid-edit.
function stateToPreview(s: EditorState): ArticleViewData {
  return {
    title: s.title.trim() || 'Untitled',
    summary: s.summary.trim(),
    body: s.body.trim() ? s.body : '_Start writing to see the preview…_',
    headerImageUrl: s.headerImageUrl.trim(),
    tags: s.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    published: s.published,
    publishedAt: s.publishedAt ? new Date(s.publishedAt).toISOString() : null,
  };
}

// Debounce a value so the live preview re-renders (re-parsing Markdown and
// re-drawing any mermaid diagrams) a beat after typing stops, not on every
// keystroke.
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-2.5 py-1 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'mb-0.5 block text-xs font-medium text-gray-700';

export default function ArticlesEditor({
  initialArticles,
}: ArticlesEditorProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [editing, setEditing] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const derivedSlug = useMemo(
    () => (editing ? editing.slug || previewSlug(editing.title) : ''),
    [editing]
  );

  const debouncedEditing = useDebouncedValue(editing, 150);
  const previewArticle = useMemo(
    () => (debouncedEditing ? stateToPreview(debouncedEditing) : null),
    [debouncedEditing]
  );

  function set<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.title.trim()) {
      flash('Title is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        editing.id ? `/api/articles/${editing.id}` : '/api/articles',
        {
          method: editing.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stateToInput(editing)),
        }
      );
      if (!res.ok) {
        flash('Failed to save article');
        return;
      }
      const saved: Article = await res.json();
      setArticles((prev) =>
        editing.id
          ? prev.map((a) => (a.id === saved.id ? saved : a))
          : [saved, ...prev]
      );
      setEditing(articleToState(saved));
      flash('Saved');
    } catch {
      flash('Error saving article');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing?.id) {
      setEditing(null);
      return;
    }
    if (!confirm('Delete this article? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/articles/${editing.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        flash('Failed to delete');
        return;
      }
      setArticles((prev) => prev.filter((a) => a.id !== editing.id));
      setEditing(null);
      flash('Deleted');
    } catch {
      flash('Error deleting');
    }
  }

  const isNew = editing !== null && editing.id === null;

  return (
    <section id="articles" className="mt-6">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Articles</h2>
          <p className="text-xs text-gray-500">
            Markdown posts with code, images, and{' '}
            <code className="rounded bg-gray-100 px-1">```mermaid</code>{' '}
            diagrams. The assistant can read published articles on request.
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyState())}
          className="flex-none rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
        >
          New article
        </button>
      </div>

      {/* Article picker: a compact chip bar. Keeps every article one click away
          while spending vertical, not horizontal, space — so the edit/preview
          split below gets the full width. */}
      {(articles.length > 0 || isNew) && (
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
          {isNew && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium text-white">
              <span className="max-w-[14rem] truncate">
                {editing.title.trim() || 'Untitled'}
              </span>
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                New
              </span>
            </span>
          )}
          {articles.map((a) => {
            const active = editing?.id === a.id;
            return (
              <button
                key={a.id}
                type="button"
                title={a.title || 'Untitled'}
                onClick={() => setEditing(articleToState(a))}
                className={`inline-flex max-w-[16rem] items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="truncate">{a.title || 'Untitled'}</span>
                {!a.published ? (
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                      active ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    Draft
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {!editing ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500">
          {articles.length
            ? 'Select an article above, or create a new one.'
            : 'No articles yet — create your first one.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* ── Edit form ─────────────────────────────────────────── */}
          <div className="min-w-0 space-y-2">
            <div>
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => set('title', e.target.value)}
                className={inputClass}
                placeholder="How I scaled Postgres"
              />
            </div>

            <div>
              <label className={labelClass}>
                Slug{' '}
                <span className="font-normal text-gray-400">
                  (URL: /articles/{derivedSlug || 'your-slug'})
                </span>
              </label>
              <input
                type="text"
                value={editing.slug}
                onChange={(e) => set('slug', e.target.value)}
                className={inputClass}
                placeholder={previewSlug(editing.title) || 'auto from title'}
              />
            </div>

            <div>
              <label className={labelClass}>
                Summary{' '}
                <span className="font-normal text-gray-400">
                  (shown on cards + given to the assistant)
                </span>
              </label>
              <textarea
                value={editing.summary}
                onChange={(e) => set('summary', e.target.value)}
                rows={2}
                className={`${inputClass} resize-y`}
              />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Header image URL</label>
                <input
                  type="text"
                  value={editing.headerImageUrl}
                  onChange={(e) => set('headerImageUrl', e.target.value)}
                  className={inputClass}
                  placeholder="https://…"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Tags{' '}
                  <span className="font-normal text-gray-400">
                    (comma-separated)
                  </span>
                </label>
                <input
                  type="text"
                  value={editing.tags}
                  onChange={(e) => set('tags', e.target.value)}
                  className={inputClass}
                  placeholder="postgres, performance"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={editing.published}
                  onChange={(e) => set('published', e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Published
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-700">Publish date</label>
                <input
                  type="date"
                  value={editing.publishedAt}
                  onChange={(e) => set('publishedAt', e.target.value)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-[13px] text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Body{' '}
                <span className="font-normal text-gray-400">
                  (Markdown — code, images, and ```mermaid diagrams)
                </span>
              </label>
              <textarea
                value={editing.body}
                onChange={(e) => set('body', e.target.value)}
                rows={16}
                className="w-full resize-y rounded-lg border border-gray-300 px-2.5 py-1.5 font-mono text-xs leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  '# Heading\n\nProse, **bold**, `code`.\n\n```ts\nconst x = 1;\n```\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\n![caption](https://image-url)'
                }
              />
            </div>

            <div className="flex items-center gap-3 border-t border-gray-200 pt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-red-600 hover:text-red-700"
              >
                {editing.id ? 'Delete' : 'Discard'}
              </button>
              {message ? (
                <span
                  className={`text-xs ${
                    message === 'Saved' || message === 'Deleted'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {message}
                </span>
              ) : null}
            </div>
          </div>

          {/* ── Live preview ──────────────────────────────────────────
              Sticks to the top and scrolls on its own so as much of the
              article stays in view as possible while you edit the form. */}
          <div className="min-w-0">
            <div className="lg:sticky lg:top-4">
              <div className="mb-1.5 flex items-center justify-between px-0.5">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Live preview
                </span>
                {editing.id ? (
                  <a
                    href={`/articles/${editing.slug || derivedSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Open page ↗
                  </a>
                ) : null}
              </div>
              <div className="rounded-xl border border-gray-200 bg-surface px-4 py-4 shadow-sm lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
                {/* zoom shows more of the (faithful) article at once; tweak or
                    drop for a 1:1 preview */}
                <div className="mx-auto max-w-3xl" style={{ zoom: 0.85 }}>
                  {previewArticle ? (
                    <ArticleView article={previewArticle} />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
