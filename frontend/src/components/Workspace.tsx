"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link as LinkIcon, NotebookText, Trash2, Video } from "lucide-react";
import {
  createSource,
  deleteSource,
  fetchSources,
  Source,
  SourceType,
} from "@/lib/api";

function detectSourceType(content: string): SourceType {
  const trimmed = content.trim();
  const lower = trimmed.toLowerCase();

  const isUrl = /^https?:\/\/\S+/i.test(trimmed);
  const isYouTube =
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtu\.be\/)/i.test(
      lower
    );

  if (isYouTube) {
    return "video";
  }

  if (isUrl) {
    return "link";
  }

  return "note";
}

function typeIcon(type: SourceType) {
  if (type === "video") {
    return <Video size={18} className="text-rose-300" />;
  }
  if (type === "link") {
    return <LinkIcon size={18} className="text-cyan-300" />;
  }
  return <NotebookText size={18} className="text-emerald-300" />;
}

export default function Workspace() {
  const [input, setInput] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectedType = useMemo(() => detectSourceType(input), [input]);

  useEffect(() => {
    const loadSources = async () => {
      try {
        const allSources = await fetchSources();
        setSources(allSources);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sources.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSources();
  }, []);

  const handleAddSource = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const saved = await createSource({
        type: detectSourceType(content),
        content,
      });
      setSources((previous) => [saved, ...previous]);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add source.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSource = async (sourceId: number) => {
    setError(null);
    try {
      await deleteSource(sourceId);
      setSources((previous) => previous.filter((source) => source.id !== sourceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete source.");
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-lg">
        <h2 className="text-xl font-medium">Drag &amp; Drop Workspace</h2>
        <p className="mt-2 text-sm text-slate-300">
          Paste a YouTube URL, website link, or write quick notes to build your study
          source stack.
        </p>

        <form className="mt-6 space-y-3" onSubmit={handleAddSource}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-32 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-400 focus:ring-2"
            placeholder="Paste URL or type a note..."
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-300">
              Detected type: <span className="font-semibold text-cyan-300">{detectedType}</span>
            </p>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Add Source"}
            </button>
          </div>
        </form>
      </div>

      <aside className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-lg">
        <h3 className="text-lg font-medium">Added Sources</h3>
        {error && (
          <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        {isLoading ? (
          <p className="mt-4 text-sm text-slate-300">Loading sources...</p>
        ) : sources.length === 0 ? (
          <p className="mt-4 text-sm text-slate-300">No sources added yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sources.map((source) => (
              <li
                key={source.id}
                className="rounded-xl border border-slate-700 bg-slate-950/80 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {typeIcon(source.type)}
                    <span className="text-xs uppercase tracking-wide text-slate-300">
                      {source.type}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteSource(source.id)}
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-800 hover:text-rose-300"
                    aria-label="Delete source"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="mt-2 wrap-break-word text-sm text-slate-100">{source.content}</p>
                {source.video_id && (
                  <p className="mt-1 text-xs text-slate-400">Video ID: {source.video_id}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </section>
  );
}
