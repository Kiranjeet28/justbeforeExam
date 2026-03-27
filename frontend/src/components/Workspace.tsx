"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link as LinkIcon, NotebookText, Trash2, Video, Check, Loader2, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createSource,
  deleteSource,
  fetchSources,
  generateNotes,
  generateCheatSheet,
  RateLimitError,
  Source,
  SourceType,
} from "@/lib/api";
import { NotesCanvas } from "./NotesCanvas";
interface Citation {
  id: number;
  type: string;
  preview: string;
}
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
  const [notesContent, setNotesContent] = useState("");
  const [notesCitations, setNotesCitations] = useState<Citation[]>([]);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [notesLoadingStage, setNotesLoadingStage] = useState(0);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [cheatSheetContent, setCheatSheetContent] = useState("");
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isGeneratingCheatSheet, setIsGeneratingCheatSheet] = useState(false);

  const detectedType = useMemo(() => detectSourceType(input), [input]);

  // Handle rate limit countdown
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;

    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          setError(null); // Clear error when countdown ends
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

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

  const handleGenerateNotes = async () => {
    if (sources.length === 0) {
      setError("Please add some sources before generating notes.");
      return;
    }

    // Prevent generating if rate limited
    if (rateLimitCountdown > 0) {
      setError(`Please wait ${rateLimitCountdown} seconds before retrying.`);
      return;
    }

    setIsGeneratingNotes(true);
    setError(null);
    setNotesLoadingStage(0);

    try {
      // Simulate loading stages
      setNotesLoadingStage(1); // "Reading sources..."
      await new Promise((resolve) => setTimeout(resolve, 800));

      setNotesLoadingStage(2); // "Analyzing context..."
      const response = await generateNotes();

      setNotesLoadingStage(3); // "Writing notes..."
      await new Promise((resolve) => setTimeout(resolve, 500));

      setNotesContent(response.notes);
      setNotesCitations(response.citations || []);
      setIsNotesOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate notes. Please try again.";

      // Check if it's a rate limit error
      if (err instanceof Error && (err.name === "RateLimitError" || errorMessage.includes("429"))) {
        setRateLimitCountdown(60);
        setError("API Limit reached. Please wait 60 seconds before retrying.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsGeneratingNotes(false);
      setNotesLoadingStage(0);
    }
  };

  const handleSaveNotes = async (title: string, content: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBase}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          title,
          source_ids: sources.map((s) => s.id).join(","),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setNotesContent("");
      setIsNotesOpen(false);
    } catch (err) {
      throw err;
    }
  };

  const handleGenerateCheatSheet = async () => {
    if (sources.length === 0) {
      setError("Please add some sources before generating a cheat sheet.");
      return;
    }

    // Prevent generating if rate limited
    if (rateLimitCountdown > 0) {
      setError(`Please wait ${rateLimitCountdown} seconds before retrying.`);
      return;
    }

    setIsGeneratingCheatSheet(true);
    setError(null);

    try {
      const response = await generateCheatSheet({
        source_ids: sources.map((s) => s.id),
        topic: "",
      });

      setCheatSheetContent(response.notes);
      setIsCheatSheetOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate cheat sheet. Please try again.";

      // Check if it's a rate limit error
      if (err instanceof RateLimitError || errorMessage.includes("429")) {
        setRateLimitCountdown(60);
        setError("API Limit reached. Please wait 60 seconds before retrying.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsGeneratingCheatSheet(false);
    }
  };

  const handlePaste = () => {
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
    <>
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
            <ul className="mt-4 space-y-3">
              {sources.map((source) => (
                <motion.li
                  key={source.id}
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-slate-700 bg-slate-950/80 p-3 transition-shadow hover:shadow-lg"
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
            </ul>
          )}

          {sources.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-3"
            >
              {/* Generate Notes Button/Loading */}
              {isGeneratingNotes ? (
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 size={16} className="animate-spin text-cyan-400" />
                    <p className="text-sm font-semibold text-cyan-300">
                      {notesLoadingStage === 1
                        ? "Reading sources..."
                        : notesLoadingStage === 2
                          ? "Analyzing context..."
                          : "Writing notes..."}
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                    <motion.div
                      className="h-full bg-linear-to-r from-cyan-400 to-emerald-400"
                      initial={{ width: "0%" }}
                      animate={{
                        width:
                          notesLoadingStage === 1
                            ? "33%"
                            : notesLoadingStage === 2
                              ? "66%"
                              : "100%",
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ) : (
                <motion.button
                  onClick={handleGenerateNotes}
                  disabled={isGeneratingNotes || rateLimitCountdown > 0}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${rateLimitCountdown > 0
                    ? "cursor-not-allowed bg-slate-700 text-slate-400 opacity-50"
                    : "bg-linear-to-r from-cyan-400 to-emerald-400 text-slate-950 hover:shadow-lg hover:shadow-cyan-400/20"
                    }`}
                  whileHover={rateLimitCountdown > 0 ? {} : { scale: 1.02 }}
                  whileTap={rateLimitCountdown > 0 ? {} : { scale: 0.98 }}
                >
                  <Sparkles size={18} />
                  {rateLimitCountdown > 0
                    ? `Wait ${rateLimitCountdown}s`
                    : "Generate Study Notes"}
                </motion.button>
              )}

              {/* Generate Cheat Sheet Button */}
              {isGeneratingCheatSheet ? (
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-cyan-400" />
                    <p className="text-sm font-medium text-slate-200">
                      Analyzing sources with RAG...
                    </p>
                  </div>
                </div>
              ) : (
                <motion.button
                  onClick={handleGenerateCheatSheet}
                  disabled={isGeneratingCheatSheet || rateLimitCountdown > 0}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${rateLimitCountdown > 0
                    ? "cursor-not-allowed bg-slate-700 text-slate-400 opacity-50"
                    : "bg-linear-to-r from-amber-400 to-orange-400 text-slate-950 hover:shadow-lg hover:shadow-amber-400/20"
                    }`}
                  whileHover={rateLimitCountdown > 0 ? {} : { scale: 1.02 }}
                  whileTap={rateLimitCountdown > 0 ? {} : { scale: 0.98 }}
                >
                  <Sparkles size={18} />
                  {rateLimitCountdown > 0
                    ? `Wait ${rateLimitCountdown}s`
                    : "Generate Cheat Sheet"}
                </motion.button>
              )}
            </motion.div>
          )}

          <AnimatePresence>
            {isCheatSheetOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCheatSheetOpen(false)}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative flex h-[90vh] w-[95vw] max-w-4xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-700 p-6">
                    <h2 className="text-2xl font-bold text-slate-100">Cheat Sheet</h2>
                    <button
                      onClick={() => setIsCheatSheetOpen(false)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                    >
                      <Minimize2 size={24} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose prose-invert max-w-none">
                      {cheatSheetContent ? (
                        <pre className="whitespace-pre-wrap rounded-lg bg-slate-800/50 p-4 text-sm text-slate-200">
                          {cheatSheetContent}
                        </pre>
                      ) : (
                        <p className="text-slate-400">No content generated yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 border-t border-slate-700 bg-slate-800/50 p-4">
                    <motion.button
                      onClick={() => setIsCheatSheetOpen(false)}
                      className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Close
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </section >

      <NotesCanvas
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        initialNotes={notesContent}
        citations={notesCitations}
        onSave={handleSaveNotes}
      />

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
    </>
  );
}
