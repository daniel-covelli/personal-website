'use client';

import { useMemo, useState } from 'react';
import { Article, ArticleInput } from '@/lib/types';
import ArticleMarkdown from '@/components/articles/ArticleMarkdown';

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
    publishedAt: s.publishedAt
      ? new Date(s.publishedAt).toISOString()
      : null,
  };
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

export default function ArticlesEditor({
  initialArticles,
}: ArticlesEditorProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [editing, setEditing] = useState<EditorState | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const derivedSlug = useMemo(
    () => (editing ? editing.slug || previewSlug(editing.title) : ''),
    [editing]
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

  return (
    <section id="articles" className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
          <p className="text-sm text-gray-500">
            Markdown posts with code, images, and{' '}
            <code className="rounded bg-gray-100 px-1">```mermaid</code>{' '}
            diagrams. The assistant can read published articles on request.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(emptyState());
            setShowPreview(false);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          New article
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* List */}
        <div className="lg:w-64 lg:flex-shrink-0">
          {articles.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
              No articles yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {articles.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => {
                      setEditing(articleToState(a));
                      setShowPreview(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      editing?.id === a.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate">{a.title || 'Untitled'}</span>
                      {!a.published ? (
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${
                            editing?.id === a.id
                              ? 'bg-white/20'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          Draft
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          {!editing ? (
            <p className="py-12 text-center text-gray-500">
              Select an article to edit, or create a new one.
            </p>
          ) : (
            <div className="space-y-4">
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
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editing.published}
                    onChange={(e) => set('published', e.target.checked)}
                    className="h-4 w-4"
                  />
                  Published
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Publish date</label>
                  <input
                    type="date"
                    value={editing.publishedAt}
                    onChange={(e) => set('publishedAt', e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className={labelClass + ' mb-0'}>
                    Body (Markdown)
                  </label>
                  <button
                    onClick={() => setShowPreview((v) => !v)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showPreview ? 'Edit' : 'Preview'}
                  </button>
                </div>
                {showPreview ? (
                  <div className="min-h-[300px] rounded-lg border border-gray-200 bg-white p-4">
                    <ArticleMarkdown>
                      {editing.body || '_Nothing to preview yet._'}
                    </ArticleMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={editing.body}
                    onChange={(e) => set('body', e.target.value)}
                    rows={20}
                    className={`${inputClass} font-mono text-sm`}
                    placeholder={
                      '# Heading\n\nProse, **bold**, `code`.\n\n```ts\nconst x = 1;\n```\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\n![caption](https://image-url)'
                    }
                  />
                )}
              </div>

              <div className="flex items-center gap-4 border-t border-gray-200 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                {editing.id ? (
                  <a
                    href={`/articles/${editing.slug}`}
                    target="_blank"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View →
                  </a>
                ) : null}
                <button
                  onClick={handleDelete}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  {editing.id ? 'Delete' : 'Discard'}
                </button>
                {message ? (
                  <span
                    className={`text-sm ${
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
          )}
        </div>
      </div>
    </section>
  );
}
