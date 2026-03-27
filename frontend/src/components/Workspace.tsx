"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { NotebookText, Trash2, Video, Check, Loader2, Maximize2, Minimize2, Sparkles, Globe } from "lucide-react";
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

interface WorkspaceProps {
  onSourcesChange?: (count: number) => void;
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
    return <Video size={18} className="text-rose-400 shrink-0" />;
  }
  if (type === "link") {
    return <Globe size={18} className="text-cyan-400 shrink-0" />;
  }
  return <NotebookText size={18} className="text-emerald-400 shrink-0" />;
}

export default function Workspace({ onSourcesChange }: WorkspaceProps) {
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
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  // Notify parent of sources count change
  useEffect(() => {
    onSourcesChange?.(sources.length);
  }, [sources.length, onSourcesChange]);

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

    if (rateLimitCountdown > 0) {
      setError(`Please wait ${rateLimitCountdown} seconds before retrying.`);
      return;
    }

    setIsGeneratingNotes(true);
    setError(null);
    setNotesLoadingStage(0);

    try {
      setNotesLoadingStage(1);
      await new Promise((resolve) => setTimeout(resolve, 800));

      setNotesLoadingStage(2);
      const response = await generateNotes();

      setNotesLoadingStage(3);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setNotesContent(response.notes);
      setNotesCitations(response.citations || []);
      setIsNotesOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate notes. Please try again.";

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
      {/* Two-column responsive grid: 60/40 desktop, single column mobile */}
      <section className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Input Section - 60% on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-slate-700/50 bg-linear-to-br from-slate-900/50 via-slate-900/30 to-slate-950/50 p-6 shadow-xl backdrop-blur-sm"
        >
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold text-slate-100">Add Your Sources</h2>
            <p className="text-sm text-slate-400">
              Drag, paste a YouTube URL, website link, or write quick notes to build your study source stack.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleAddSource}>
            {/* Drag & Drop Zone with pulse animation */}
            <motion.div
              className={`relative rounded-2xl border-2 bg-slate-950/40 px-6 py-6 transition-all duration-300 ${isDragOver ? "scale-105 border-violet-400 shadow-2xl shadow-violet-500/20" : "border-slate-700"
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              animate={isDragOver ? { boxShadow: "0 0 20px 0px rgba(167, 139, 250, 0.3)" } : {}}
            >
              {/* Animated dashed border pulse */}
              {isDragOver && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-dashed border-violet-400"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onPaste={handlePaste}
                className={`relative z-10 min-h-40 w-full resize-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-violet-400 focus:ring-offset-0 rounded-lg px-2 py-1 ${isFullscreen ? "min-h-96" : ""
                  }`}
                placeholder="Paste URL, website link, or type your notes..."
              />

              {/* Detected type indicator */}
              {input.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-3 right-3 rounded-lg bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700/50"
                >
                  Detected: <span className="text-violet-300">{getDetectedLabel()}</span>
                </motion.div>
              )}

              {/* Paste animation indicator */}
              <AnimatePresence>
                {showPastedAnimation && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
                  >
                    <Check size={14} />
                    Pasted!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                Type: <span className="font-semibold text-violet-300">{detectedType}</span>
              </p>
              {detectedType === "note" && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 transition hover:bg-slate-800/50 hover:text-violet-300 min-h-11"
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  {isFullscreen ? "Minimize" : "Expand"}
                </button>
              )}
              <motion.button
                type="submit"
                disabled={isSaving || !input.trim()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-violet-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50 min-h-11"
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
        </motion.div>

        {/* Source List - 40% on desktop */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-slate-700/50 bg-linear-to-br from-slate-900/50 via-slate-900/30 to-slate-950/50 p-6 shadow-xl backdrop-blur-sm flex flex-col"
        >
          <h3 className="text-xl font-bold text-slate-100 mb-4">Added Sources</h3>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Sources List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-slate-400 py-4">Loading sources...</p>
            ) : sources.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-slate-500 text-center">No sources yet. Add one to get started!</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <ul className="space-y-3">
                  {sources.map((source) => (
                    <motion.li
                      key={source.id}
                      layout
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -100, opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="group rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 transition-all hover:bg-slate-800/50 hover:border-slate-600/50 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5 flex-1">
                          {typeIcon(source.type)}
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {source.type}
                          </span>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => void handleDeleteSource(source.id)}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-rose-300 opacity-0 group-hover:opacity-100"
                          aria-label="Delete source"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                      <p className="mt-2 text-xs sm:text-sm text-slate-300 line-clamp-2">{source.content}</p>
                      {source.video_id && (
                        <p className="mt-1.5 text-xs text-slate-500">Video ID: {source.video_id}</p>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </AnimatePresence>
            )}
          </div>

          {/* Action Buttons */}
          {sources.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-3 border-t border-slate-700/30 pt-4"
            >
              {/* Generate Notes Button */}
              {isGeneratingNotes ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 size={16} className="animate-spin text-violet-400" />
                    <p className="text-xs sm:text-sm font-semibold text-violet-300">
                      {notesLoadingStage === 1
                        ? "Reading sources..."
                        : notesLoadingStage === 2
                          ? "Analyzing context..."
                          : "Writing notes..."}
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                    <motion.div
                      className="h-full bg-linear-to-r from-violet-400 to-indigo-400"
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
                </motion.div>
              ) : (
                <motion.button
                  onClick={handleGenerateNotes}
                  disabled={isGeneratingNotes || rateLimitCountdown > 0}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs sm:text-sm font-semibold transition min-h-11 ${rateLimitCountdown > 0
                    ? "cursor-not-allowed bg-slate-700 text-slate-400 opacity-50"
                    : "bg-linear-to-r from-violet-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-violet-500/30"
                    }`}
                  whileHover={rateLimitCountdown > 0 ? {} : { scale: 1.02 }}
                  whileTap={rateLimitCountdown > 0 ? {} : { scale: 0.98 }}
                >
                  <Sparkles size={16} />
                  {rateLimitCountdown > 0
                    ? `Wait ${rateLimitCountdown}s`
                    : "Generate Notes"}
                </motion.button>
              )}

              {/* Generate Cheat Sheet Button */}
              {isGeneratingCheatSheet ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg bg-slate-800/50 p-4"
                >
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-amber-400" />
                    <p className="text-xs sm:text-sm font-medium text-slate-200">Generating...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  onClick={handleGenerateCheatSheet}
                  disabled={isGeneratingCheatSheet || rateLimitCountdown > 0}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs sm:text-sm font-semibold transition min-h-11 ${rateLimitCountdown > 0
                    ? "cursor-not-allowed bg-slate-700 text-slate-400 opacity-50"
                    : "bg-linear-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/30"
                    }`}
                  whileHover={rateLimitCountdown > 0 ? {} : { scale: 1.02 }}
                  whileTap={rateLimitCountdown > 0 ? {} : { scale: 0.98 }}
                >
                  <Sparkles size={16} />
                  {rateLimitCountdown > 0 ? `Wait ${rateLimitCountdown}s` : "Cheat Sheet"}
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Cheat Sheet Modal */}
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
        </motion.aside>
      </section>

      {/* Notes Canvas Modal */}
      <NotesCanvas
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        initialNotes={notesContent}
        citations={notesCitations}
        onSave={handleSaveNotes}
      />

      {/* Fullscreen Editor Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
                <h3 className="text-lg font-bold text-slate-100">Fullscreen Note Editor</h3>
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
                className="min-h-96 w-full resize-none rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-violet-400"
                placeholder="Type your long-form note here..."
                autoFocus
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={toggleFullscreen}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFullscreen();
                  }}
                  className="rounded-lg bg-linear-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/30"
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
