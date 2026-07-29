'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

// One blob as the /api/assets route serializes it (uploadedAt is a Date there,
// an ISO string here after JSON).
interface Asset {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

interface AssetsManagerProps {
  // Whether the Assets tab is the active one. The blob list is fetched lazily
  // the first time this flips true, so opening /admin doesn't pay a Blob API
  // call unless you actually visit this tab.
  active: boolean;
  // Concatenated header + body text of every article, used for a best-effort
  // "In use" flag. Static from the server-loaded articles, so edits made in the
  // Writing tab this session won't reflect here until reload — the delete confirm
  // is the real safety net, this is just a hint.
  articleText: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AssetsManager({
  active,
  articleText,
}: AssetsManagerProps) {
  // null = not fetched yet (distinguishes "loading" from "loaded, empty").
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notConfigured, setNotConfigured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Guards the lazy first fetch so it fires exactly once when the tab opens —
  // even if it errors (leaving assets null), so we don't spin in a retry loop.
  // Manual Refresh / Retry drive every subsequent reload.
  const autoLoadedRef = useRef(false);

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/assets');
      if (res.status === 501) {
        setNotConfigured(true);
        setAssets([]);
        return;
      }
      if (!res.ok) {
        setError('Failed to load assets');
        return;
      }
      const data = (await res.json()) as { blobs: Asset[] };
      setAssets(data.blobs);
    } catch {
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active && !autoLoadedRef.current) {
      autoLoadedRef.current = true;
      void load();
    }
  }, [active, load]);

  async function handleFiles(fileList: FileList) {
    const files = Array.from(fileList);
    if (!files.length) return;
    setUploading(true);
    let ok = 0;
    try {
      for (const file of files) {
        try {
          // Straight from the browser to Vercel Blob; /api/upload only mints the
          // (admin-gated) token. multipart splits larger files into retryable
          // parts and sidesteps the 4.5 MB Function body limit.
          await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            contentType: file.type,
            multipart: true,
          });
          ok += 1;
        } catch (err) {
          flash(err instanceof Error ? err.message : 'Upload failed');
        }
      }
      if (ok) {
        // Refetch rather than optimistically prepend: the list response is the
        // source of truth for size / uploadedAt / final suffixed URL.
        await load();
        flash(ok === 1 ? 'Uploaded' : `Uploaded ${ok} files`);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500);
    } catch {
      flash('Copy failed');
    }
  }

  async function handleDelete(asset: Asset) {
    const inUse = articleText.includes(asset.url);
    const warning = inUse
      ? '\n\nHeads up: this asset is referenced by an article — deleting it will break that image.'
      : '';
    if (
      !confirm(`Delete ${asset.pathname}? This cannot be undone.${warning}`)
    ) {
      return;
    }
    setDeletingUrl(asset.url);
    try {
      const res = await fetch('/api/assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: asset.url }),
      });
      if (!res.ok) {
        flash('Failed to delete');
        return;
      }
      setAssets((prev) =>
        prev ? prev.filter((a) => a.url !== asset.url) : prev
      );
      flash('Deleted');
    } catch {
      flash('Error deleting');
    } finally {
      setDeletingUrl(null);
    }
  }

  return (
    <section id="assets" className="mt-6">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Assets</h2>
          <p className="text-xs text-subtle">
            Images in Vercel Blob storage. Upload here, then paste an
            asset&rsquo;s URL into an article&rsquo;s header image or Markdown
            body.
          </p>
        </div>
        <div className="flex flex-none items-center gap-2">
          {assets !== null && !notConfigured ? (
            <button
              onClick={() => void load()}
              disabled={loading}
              className="rounded-lg border border-hair px-3 py-1.5 text-xs text-body hover:bg-surface disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          ) : null}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || notConfigured}
            className="rounded-lg bg-brand-solid px-3 py-1.5 text-xs text-white hover:bg-brand-solid-hover disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {message ? (
        <div
          className={`mb-2 text-[11px] ${
            /fail|error/i.test(message)
              ? 'text-red-600 dark:text-red-400'
              : 'text-green-600 dark:text-green-400'
          }`}
        >
          {message}
        </div>
      ) : null}

      {notConfigured ? (
        <div className="rounded-lg border border-dashed border-rail p-8 text-center text-xs text-subtle">
          Asset storage isn&rsquo;t configured — link a Vercel Blob store so{' '}
          <code className="rounded bg-chip px-1">
            BLOB_READ_WRITE_TOKEN
          </code>{' '}
          is set.
        </div>
      ) : error ? (
        <div className="rounded-lg border border-dashed border-red-300 p-8 text-center text-xs text-red-600 dark:border-red-900 dark:text-red-400">
          {error}.{' '}
          <button onClick={() => void load()} className="underline">
            Retry
          </button>
        </div>
      ) : assets === null ? (
        <div className="rounded-lg border border-dashed border-rail p-8 text-center text-xs text-subtle">
          Loading assets…
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-rail p-8 text-center text-xs text-subtle">
          No assets yet — upload an image to get started.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-hair">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hair bg-surface text-[10px] uppercase tracking-wide text-subtle">
                <th className="px-3 py-2 font-medium">Preview</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Size</th>
                <th className="px-3 py-2 font-medium">Uploaded</th>
                <th className="px-3 py-2 font-medium">Usage</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
                const inUse = articleText.includes(asset.url);
                const deleting = deletingUrl === asset.url;
                return (
                  <tr
                    key={asset.url}
                    className="border-b border-hair text-ink last:border-0 hover:bg-surface"
                  >
                    <td className="px-3 py-2">
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open full size"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote Blob URLs from arbitrary uploads; next/image would need per-host config for an admin-only thumbnail */}
                        <img
                          src={asset.url}
                          alt={asset.pathname}
                          className="h-10 w-10 rounded border border-hair bg-chip object-cover"
                          loading="lazy"
                        />
                      </a>
                    </td>
                    <td className="max-w-[16rem] px-3 py-2">
                      <span
                        className="block truncate text-[11px]"
                        title={asset.pathname}
                      >
                        {asset.pathname}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[11px] text-body">
                      {formatBytes(asset.size)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[11px] text-body">
                      {formatDate(asset.uploadedAt)}
                    </td>
                    <td className="px-3 py-2">
                      {inUse ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
                          In use
                        </span>
                      ) : (
                        <span className="rounded-full bg-chip px-2 py-0.5 text-[10px] text-subtle">
                          Unused
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <button
                        onClick={() => void handleCopy(asset.url)}
                        className="rounded px-2 py-1 text-[11px] font-medium text-brand hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        {copied === asset.url ? 'Copied!' : 'Copy URL'}
                      </button>
                      <button
                        onClick={() => void handleDelete(asset)}
                        disabled={deleting}
                        className="ml-1 rounded px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        {deleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
