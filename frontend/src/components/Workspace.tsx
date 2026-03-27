"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link as LinkIcon, NotebookText, Trash2, Video, Check, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPastedAnimation, setShowPastedAnimation] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    setShowPastedAnimation(true);
    setTimeout(() => setShowPastedAnimation(false), 1500);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const text = event.dataTransfer.getData("text");
    if (text) {
      setInput(text);
      setShowPastedAnimation(true);
      setTimeout(() => setShowPastedAnimation(false), 1500);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getBorderColor = () => {
    if (!input.trim()) return "border-slate-600";
    switch (detectedType) {
      case "video": return "border-red-500";
      case "link": return "border-blue-500";
      case "note": return "border-green-500";
      default: return "border-slate-600";
    }
  };

  const getDetectedLabel = () => {
    if (!input.trim()) return "";
    switch (detectedType) {
      case "video": return "YouTube";
      case "link": return "Website";
      case "note": return "Note";
      default: return "";
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
          <motion.div
            className={`relative rounded-xl border-2 bg-slate-950 px-4 py-3 transition-all duration-300 ${isDragOver ? "scale-105 shadow-lg shadow-cyan-400/20" : ""
              } ${getBorderColor()}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            animate={{
              boxShadow: isDragOver ? "0 0 20px rgba(34, 211, 238, 0.3)" : "none",
            }}
            transition={{ duration: 0.2 }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onPaste={handlePaste}
              className={`min-h-32 w-full resize-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400 ${isFullscreen ? "min-h-96" : ""
                }`}
              placeholder="Paste URL or type a note..."
            />
            {input.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-2 right-2 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300"
              >
                Detected: {getDetectedLabel()}
              </motion.div>
            )}
            <AnimatePresence>
              {showPastedAnimation && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs text-white"
                >
                  <Check size={12} />
                  Pasted
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-300">
                Detected type: <span className="font-semibold text-cyan-300">{detectedType}</span>
              </p>
              {detectedType === "note" && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-800"
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  {isFullscreen ? "Minimize" : "Expand"}
                </button>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Source"
              )}
            </motion.button>
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
          <motion.ul
            className="mt-4 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence>
              {sources.map((source) => (
                <motion.li
                  key={source.id}
                  layout
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}
                  className="rounded-xl border border-slate-700 bg-slate-950/80 p-3 transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {typeIcon(source.type)}
                      <span className="text-xs uppercase tracking-wide text-slate-300">
                        {source.type}
                      </span>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => void handleDeleteSource(source.id)}
                      className="rounded-md p-1 text-slate-400 transition hover:bg-slate-800 hover:text-rose-300"
                      aria-label="Delete source"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                  <p className="mt-2 wrap-break-word text-sm text-slate-100">{source.content}</p>
                  {source.video_id && (
                    <p className="mt-1 text-xs text-slate-400">Video ID: {source.video_id}</p>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </aside>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={toggleFullscreen}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mx-4 w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Fullscreen Note Editor</h3>
                <button
                  onClick={toggleFullscreen}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  <Minimize2 size={20} />
                </button>
              </div>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onPaste={handlePaste}
                className="min-h-96 w-full resize-none rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400"
                placeholder="Type your long-form note here..."
                autoFocus
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={toggleFullscreen}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFullscreen();
                    // The form will be submitted when fullscreen closes
                  }}
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
