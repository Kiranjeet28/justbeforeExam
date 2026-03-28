"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Trash2, Video, Globe, Loader2, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  parseLinkContent,
  sortParsedLinksByType,
  type ParsedLink,
} from "@/lib/parseLinkContent";
import { buildRagContextFromLinks } from "@/lib/buildRagContext";
import { generateExamNotes } from "@/lib/generateExamNotes";

interface WorkspaceProps {
  onSourcesChange?: (count: number) => void;
}

const MAX_LINKS = 3;
const TOAST_MAX = "Maximum 3 sources allowed for this session.";

function detectSourceType(content: string): "video" | "link" | "note" {
  const trimmed = content.trim();
  const lower = trimmed.toLowerCase();
  const isUrl = /^https?:\/\/\S+/i.test(trimmed);
  const isYouTube =
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtu\.be\/)/i.test(
      lower
    );
  if (isYouTube) return "video";
  if (isUrl) return "link";
  return "note";
}

function typeIcon(sourceType: ParsedLink["sourceType"]) {
  if (sourceType === "video") {
    return <Video size={18} className="text-rose-400 shrink-0" />;
  }
  return <Globe size={18} className="text-cyan-400 shrink-0" />;
}

export default function Workspace({ onSourcesChange }: WorkspaceProps) {
  const [input, setInput] = useState("");
  const [linkSources, setLinkSources] = useState<ParsedLink[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPastedAnimation, setShowPastedAnimation] = useState(false);
  const [isRagGenerating, setIsRagGenerating] = useState(false);
  const [ragMarkdown, setRagMarkdown] = useState("");
  const [ragModel, setRagModel] = useState("");
  const [ragModalOpen, setRagModalOpen] = useState(false);
  const detectedType = useMemo(() => detectSourceType(input), [input]);
  const sortedLinks = useMemo(() => sortParsedLinksByType(linkSources), [linkSources]);
  const selectedLink = sortedLinks.find((l) => l.id === selectedLinkId) ?? sortedLinks[0] ?? null;

  useEffect(() => {
    onSourcesChange?.(linkSources.length);
  }, [linkSources.length, onSourcesChange]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (selectedLinkId && sortedLinks.some((l) => l.id === selectedLinkId)) return;
    setSelectedLinkId(sortedLinks[0]?.id ?? null);
  }, [sortedLinks, selectedLinkId]);

  const handleAddSource = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content) return;

    const kind = detectSourceType(content);
    if (kind === "note") {
      setError("Please paste a valid http(s) URL to add a source.");
      return;
    }

    if (linkSources.length >= MAX_LINKS) {
      setToast(TOAST_MAX);
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const parsed = await parseLinkContent(content);
      setLinkSources((prev) => {
        const next = [...prev, parsed];
        return sortParsedLinksByType(next);
      });
      setSelectedLinkId(parsed.id);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse link.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeleteSource = (linkId: string) => {
    setLinkSources((prev) => {
      const next = prev.filter((s) => s.id !== linkId);
      if (selectedLinkId === linkId) {
        setSelectedLinkId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setLinkSources([]);
    setSelectedLinkId(null);
    setInput("");
    setError(null);
    setRagModalOpen(false);
    setRagMarkdown("");
    setRagModel("");
  };

  const handleGenerateExamNotes = async () => {
    if (linkSources.length === 0) return;
    setIsRagGenerating(true);
    setError(null);
    try {
      const content = buildRagContextFromLinks(linkSources);
      const { markdown, model } = await generateExamNotes(content);
      setRagMarkdown(markdown);
      setRagModel(model);
      setRagModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate exam notes.");
    } finally {
      setIsRagGenerating(false);
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

  const getDetectedLabel = () => {
    if (!input.trim()) return "";
    switch (detectedType) {
      case "video":
        return "YouTube";
      case "link":
        return "Website";
      default:
        return "";
    }
  };

  const showContentPreview = linkSources.length > 0;

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 z-100 flex max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-red-500/40 bg-slate-900/95 px-4 py-3 text-sm text-red-100 shadow-2xl backdrop-blur-md"
            role="status"
          >
            <span>{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded p-1 text-red-200/80 hover:bg-slate-800 hover:text-red-50"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-slate-700/50 bg-linear-to-br from-slate-900/50 via-slate-900/30 to-slate-950/50 p-6 shadow-xl backdrop-blur-sm"
        >
          <div className="mb-6 space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-bold text-slate-100">Direct Content</h2>
              <div className="flex items-center gap-2">
                {showContentPreview && (
                  <motion.button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-semibold uppercase tracking-wide text-rose-300/90 transition hover:text-rose-200"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Clear all
                  </motion.button>
                )}
                {linkSources.length > 0 && (
                  <motion.button
                    type="button"
                    onClick={() => void handleGenerateExamNotes()}
                    disabled={isRagGenerating}
                    className="flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-violet-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-55"
                    whileHover={isRagGenerating ? {} : { scale: 1.02 }}
                    whileTap={isRagGenerating ? {} : { scale: 0.98 }}
                  >
                    {isRagGenerating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Generate
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>

          </div>

          <form className="space-y-4" onSubmit={handleAddSource}>
            {!showContentPreview ? (
              <motion.div
                className={`relative rounded-2xl border-2 bg-slate-950/40 px-6 py-6 transition-all duration-300 ${isDragOver
                  ? "scale-105 border-violet-400 shadow-2xl shadow-violet-500/20"
                  : "border-slate-700"
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                animate={isDragOver ? { boxShadow: "0 0 20px 0px rgba(167, 139, 250, 0.3)" } : {}}
              >
                {isDragOver && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-dashed border-violet-400"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                <p className="relative z-10 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Drop zone
                </p>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onPaste={handlePaste}
                  className="relative z-10 min-h-40 w-full resize-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-violet-400 focus:ring-offset-0 rounded-lg px-2 py-1"
                  placeholder="Paste a YouTube or website URL…"
                />

                {input.trim() && detectedType !== "note" ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-10 right-3 rounded-lg border border-slate-700/50 bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-200"
                  >
                    Detected: <span className="text-violet-300">{getDetectedLabel()}</span>
                  </motion.div>
                ) : null}

                <AnimatePresence>
                  {showPastedAnimation && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
                    >
                      Pasted!
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-700/80 bg-slate-950/50 p-4">
                  {linkSources.length < MAX_LINKS && (
                    <div className="mb-4 flex flex-col gap-2 border-b border-slate-700/50 pb-4 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs text-slate-500">Add another URL</label>
                        <input
                          type="url"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onPaste={handlePaste}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-violet-400"
                          placeholder="https://…"
                        />
                      </div>
                      <motion.button
                        type="submit"
                        disabled={isParsing || !input.trim()}
                        className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isParsing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Parsing…
                          </>
                        ) : (
                          "Add link"
                        )}
                      </motion.button>
                    </div>
                  )}

                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Content preview
                  </p>

                  <div className="mb-4 flex flex-col gap-3">
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-rose-400/90">
                        Video
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sortedLinks
                          .filter((l) => l.sourceType === "video")
                          .map((link) => (
                            <motion.button
                              key={link.id}
                              type="button"
                              onClick={() => setSelectedLinkId(link.id)}
                              className={`max-w-full truncate rounded-full border px-3 py-1.5 text-xs font-medium transition ${selectedLink?.id === link.id
                                ? "border-rose-400/60 bg-rose-500/20 text-rose-100"
                                : "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500"
                                }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              title={link.url}
                            >
                              {link.videoTitle ?? "Video"}
                            </motion.button>
                          ))}
                        {sortedLinks.every((l) => l.sourceType !== "video") && (
                          <span className="text-xs text-slate-600">No video sources</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400/90">
                        Article
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sortedLinks
                          .filter((l) => l.sourceType === "article")
                          .map((link) => (
                            <motion.button
                              key={link.id}
                              type="button"
                              onClick={() => setSelectedLinkId(link.id)}
                              className={`max-w-full truncate rounded-full border px-3 py-1.5 text-xs font-medium transition ${selectedLink?.id === link.id
                                ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100"
                                : "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500"
                                }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              title={link.url}
                            >
                              {link.title ?? "Article"}
                            </motion.button>
                          ))}
                        {sortedLinks.every((l) => l.sourceType !== "article") && (
                          <span className="text-xs text-slate-600">No article sources</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative min-h-[200px] overflow-x-clip overflow-y-visible rounded-xl border border-slate-800 bg-slate-900/40">
                    <AnimatePresence mode="wait">
                      {selectedLink && (
                        <motion.div
                          key={selectedLink.id}
                          initial={{ x: 28, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -28, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          className="p-4"
                        >
                          {selectedLink.sourceType === "video" ? (
                            <div className="space-y-4 text-sm text-slate-200">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  Video title
                                </p>
                                <p className="mt-1 wrap-break-word text-slate-100">{selectedLink.videoTitle}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  Channel name
                                </p>
                                <p className="mt-1 wrap-break-word">{selectedLink.channelName}</p>
                              </div>
                              {selectedLink.transcriptError && (
                                <p className="text-sm leading-snug text-red-400" role="alert">
                                  {selectedLink.transcriptError}
                                </p>
                              )}
                              {selectedLink.transcript && !selectedLink.transcriptError && (
                                <p className="text-xs text-emerald-400/90">
                                  Transcript loaded ({selectedLink.transcriptLanguage ?? "unknown"}
                                  {selectedLink.transcriptIsGenerated ? ", auto-generated" : ""})
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4 text-sm text-slate-200">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                  Title
                                </p>
                                <p className="mt-1 font-medium text-slate-100">{selectedLink.title}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                  URL
                                </p>
                                <p className="mt-1 break-all text-cyan-300/90">{selectedLink.url}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                  Cleaned text paragraphs
                                </p>
                                <div className="mt-2 space-y-3">
                                  {(selectedLink.cleanedParagraphs ?? []).map((para, i) => (
                                    <p key={i} className="leading-relaxed text-slate-300">
                                      {para}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-6 space-y-3 border-t border-slate-700/30 pt-4">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handlePaste}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-violet-400"
                        placeholder="https://…"
                      />
                      <motion.button
                        type="submit"
                        disabled={isParsing || !input.trim()}
                        className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isParsing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Parsing…
                          </>
                        ) : (
                          "Add link"
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!showContentPreview && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-slate-400">
                  {input.trim()
                    ? detectedType === "note"
                      ? "Plain text is not accepted in this mode."
                      : `Ready: ${detectedType === "video" ? "video" : "article"}`
                    : "Paste a URL to begin."}
                </p>
                <motion.button
                  type="submit"
                  disabled={isParsing || !input.trim() || detectedType === "note"}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-violet-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50 min-h-11"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isParsing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Parsing…
                    </>
                  ) : (
                    "Add link"
                  )}
                </motion.button>
              </div>
            )}
          </form>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col rounded-2xl border border-slate-700/50 bg-linear-to-br from-slate-900/50 via-slate-900/30 to-slate-950/50 p-6 shadow-xl backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-100">Session sources</h3>
            {linkSources.length > 0 && (
              <motion.button
                type="button"
                onClick={() => void handleGenerateExamNotes()}
                disabled={isRagGenerating}
                className="flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-violet-500 to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-55"
                whileHover={isRagGenerating ? {} : { scale: 1.02 }}
                whileTap={isRagGenerating ? {} : { scale: 0.98 }}
              >
                {isRagGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate
                  </>
                )}
              </motion.button>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </motion.div>
          )}

          <div className="flex-1 overflow-y-auto">
            {linkSources.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-center text-sm text-slate-500">No links yet. Add one to get started.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <ul className="space-y-3">
                  {sortedLinks.map((source) => (
                    <motion.li
                      key={source.id}
                      layout
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -100, opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="group rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 transition-all hover:border-slate-600/50 hover:bg-slate-800/50 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          {typeIcon(source.sourceType)}
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {source.sourceType}
                          </span>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => handleDeleteSource(source.id)}
                          className="rounded-md p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-700 hover:text-rose-300 group-hover:opacity-100"
                          aria-label="Remove source"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-300 sm:text-sm">{source.url}</p>
                    </motion.li>
                  ))}
                </ul>
              </AnimatePresence>
            )}
          </div>

          {linkSources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-3 border-t border-slate-700/30 pt-4"
            >
              <p className="text-center text-xs text-slate-500">
                {linkSources.length} of {MAX_LINKS} links · sends combined text to backend{" "}
                <code className="rounded bg-slate-800/80 px-1 text-[10px] text-slate-400">/api/v1/generate</code>
              </p>
            </motion.div>
          )}
        </motion.aside>
      </section>

      <AnimatePresence>
        {ragModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/65 backdrop-blur-sm"
            onClick={() => setRagModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[90vh] w-[95vw] max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Exam notes</h2>
                  {ragModel && (
                    <p className="text-xs text-slate-500">
                      Model: <span className="text-violet-300">{ragModel}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setRagModalOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="prose prose-invert max-w-none prose-headings:text-violet-200 prose-p:text-slate-300">
                  <ReactMarkdown
                    components={{
                      h2: ({ ...props }) => (
                        <h2 className="mt-6 mb-3 text-xl font-bold text-violet-300" {...props} />
                      ),
                      h3: ({ ...props }) => (
                        <h3 className="mt-4 mb-2 text-lg font-semibold text-slate-100" {...props} />
                      ),
                      p: ({ ...props }) => <p className="mb-3 leading-relaxed text-slate-300" {...props} />,
                      ul: ({ ...props }) => (
                        <ul className="mb-3 list-inside list-disc space-y-1 text-slate-300" {...props} />
                      ),
                      ol: ({ ...props }) => (
                        <ol className="mb-3 list-inside list-decimal space-y-1 text-slate-300" {...props} />
                      ),
                      li: ({ ...props }) => <li className="text-slate-300" {...props} />,
                      strong: ({ ...props }) => <strong className="font-semibold text-emerald-300" {...props} />,
                      code: ({ ...props }) => (
                        <code
                          className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm text-rose-200"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {ragMarkdown}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
