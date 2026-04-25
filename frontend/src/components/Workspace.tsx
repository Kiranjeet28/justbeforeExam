"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Trash2,
  Video,
  Globe,
  Loader2,
  X,
  Sparkles,
  Plus,
  Check,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  parseLinkContent,
  sortParsedLinksByType,
  type ParsedLink,
} from "@/lib/parseLinkContent";
import { buildRagContextFromLinks } from "@/lib/buildRagContext";
import {
  generateExamNotes,
  RateLimitedException,
} from "@/lib/generateExamNotes";
import { RateLimitFallback } from "@/components/RateLimitFallback";

interface WorkspaceProps {
  onSourcesChange?: (count: number) => void;
}

interface TestURL {
  url: string;
  label: string;
  description: string;
}

const MAX_LINKS = 3;
const TOAST_MAX = "Maximum 3 sources allowed for this session.";

const PREDEFINED_TEST_URLS: TestURL[] = [
  {
    url: "https://www.geeksforgeeks.org/computer-networks/cryptography-and-its-types/",
    label: "GeeksforGeeks - Cryptography",
    description: "Comprehensive guide on cryptography types",
  },
  {
    url: "https://www.tutorialspoint.com/cryptography/index.htm",
    label: "TutorialsPoint - Cryptography",
    description: "Complete cryptography tutorial",
  },
  {
    url: "https://youtu.be/trHox1bN5es?si=HkTPipEwVRi7In3H",
    label: "YouTube - Cryptography Basics",
    description: "Video introduction to cryptography",
  },
];

function detectSourceType(content: string): "video" | "link" | "note" {
  const trimmed = content.trim();
  const lower = trimmed.toLowerCase();
  const isUrl = /^https?:\/\/\S+/i.test(trimmed);
  const isYouTube =
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtu\.be\/)/i.test(
      lower,
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
  const [rateLimitError, setRateLimitError] = useState<{
    retryAfter: number;
    retryAt: string;
    message: string;
  } | null>(null);
  const [pendingGeneration, setPendingGeneration] = useState<string | null>(
    null,
  );
  const detectedType = useMemo(() => detectSourceType(input), [input]);
  const sortedLinks = useMemo(
    () => sortParsedLinksByType(linkSources),
    [linkSources],
  );
  const selectedLink =
    sortedLinks.find((l) => l.id === selectedLinkId) ?? sortedLinks[0] ?? null;

  useEffect(() => {
    onSourcesChange?.(linkSources.length);
  }, [linkSources.length, onSourcesChange]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (selectedLinkId && sortedLinks.some((l) => l.id === selectedLinkId))
      return;
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
      console.log("🚀 Starting exam notes generation...");
      const { markdown, model } = await generateExamNotes(content);
      console.log("✅ Model used:", model);
      console.log("📝 Generated markdown length:", markdown.length);
      setRagMarkdown(markdown);
      setRagModel(model);
      setRagModalOpen(true);
      setRateLimitError(null);
    } catch (err) {
      console.error("❌ Error generating exam notes:", err);

      if (err instanceof RateLimitedException) {
        console.warn(`⏱️ Rate limited. Retry after ${err.retry_after}s`);
        setRateLimitError({
          retryAfter: err.retry_after,
          retryAt: err.retry_at,
          message: err.message,
        });
        setPendingGeneration(buildRagContextFromLinks(linkSources));
        setIsRagGenerating(false);
        return;
      }

      setError(
        err instanceof Error ? err.message : "Failed to generate exam notes.",
      );
    } finally {
      setIsRagGenerating(false);
    }
  };

  const handleRateLimitRetry = async () => {
    if (!pendingGeneration) return;
    setRateLimitError(null);
    await handleGenerateExamNotes();
  };

  const handlePaste = () => {
    setShowPastedAnimation(true);
    setTimeout(() => setShowPastedAnimation(false), 1500);
  };

  const handleSelectTestUrl = (url: string) => {
    setInput(url);
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
      {/* Enhanced Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 z-100 flex max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/80 to-red-950/80 px-5 py-4 text-sm font-medium text-amber-100 shadow-2xl backdrop-blur-xl"
            role="status"
          >
            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
            </div>
            <span>{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-auto flex-shrink-0 rounded-lg p-1 text-amber-200/70 hover:bg-slate-700/40 hover:text-amber-100 transition-all duration-200"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
        {/* Left Column - Main Workspace */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-950/60 p-8 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-slate-700/60"
        >
          {/* Header Section */}
          <div className="mb-8 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Direct Content
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Add sources to generate comprehensive study materials
                </p>
              </div>
              {showContentPreview && (
                <motion.button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest text-rose-300/90 hover:text-rose-200 hover:bg-rose-500/10 transition-all duration-200 border border-rose-500/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear all
                </motion.button>
              )}
            </div>
          </div>

          {/* Generate Button - Visible when sources exist */}
          {linkSources.length > 0 && (
            <motion.button
              type="button"
              onClick={() => void handleGenerateExamNotes()}
              disabled={isRagGenerating}
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={`mb-8 w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-8 py-4 text-center font-bold text-white shadow-xl shadow-blue-600/25 transition-all duration-300 ${
                isRagGenerating
                  ? "cursor-not-allowed opacity-70"
                  : "hover:shadow-xl hover:shadow-blue-600/40 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700"
              }`}
              whileHover={isRagGenerating ? {} : { scale: 1.02, y: -2 }}
              whileTap={isRagGenerating ? {} : { scale: 0.98 }}
            >
              <div className="flex items-center justify-center gap-3">
                {isRagGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Loader2 size={22} />
                    </motion.div>
                    <span className="text-lg font-semibold">Generating...</span>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles size={22} />
                    </motion.div>
                    <span className="text-lg font-semibold">
                      Generate Exam Notes
                    </span>
                  </>
                )}
              </div>
            </motion.button>
          )}

          {/* Form Section */}
          <form className="space-y-6" onSubmit={handleAddSource}>
            {!showContentPreview ? (
              // Initial State - Drag & Drop Zone
              <motion.div
                className={`relative rounded-2xl border-2 bg-slate-950/30 px-8 py-8 transition-all duration-300 backdrop-blur-sm ${
                  isDragOver
                    ? "scale-[1.02] border-blue-400/80 shadow-2xl shadow-blue-500/20 bg-blue-950/20"
                    : "border-slate-700/60 hover:border-slate-700/80"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Animated Border on Drag */}
                <AnimatePresence>
                  {isDragOver && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-dashed border-blue-400"
                      animate={{ opacity: [0.2, 0.6, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      initial={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </AnimatePresence>

                {/* Drag Zone Content */}
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Globe className="text-blue-400" size={24} />
                      </motion.div>
                    </div>
                  </div>

                  <p className="text-center text-sm font-semibold text-slate-300">
                    Drag and drop a URL here
                  </p>
                  <p className="text-center text-xs text-slate-500">
                    or paste a YouTube link or website URL
                  </p>

                  {/* Predefined Test URLs Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 justify-center px-4 py-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Zap size={12} className="text-amber-400" />
                        Quick Start
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {PREDEFINED_TEST_URLS.map((testUrl, idx) => (
                        <motion.button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectTestUrl(testUrl.url)}
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.05 * idx }}
                          whileHover={{ scale: 1.05, translateY: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="group relative rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/20 p-3 text-left transition-all duration-300 hover:border-blue-500/40 hover:bg-gradient-to-br hover:from-slate-800/60 hover:to-blue-950/20 hover:shadow-lg hover:shadow-blue-500/10"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-100 line-clamp-1 group-hover:text-blue-300 transition-colors">
                                {testUrl.label}
                              </p>
                              <div className="flex-shrink-0 rounded-full bg-blue-500/10 p-1.5 group-hover:bg-blue-500/20 transition-colors">
                                <Zap size={11} className="text-blue-400" />
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1 group-hover:text-slate-300 transition-colors">
                              {testUrl.description}
                            </p>
                          </div>

                          {/* Animated Border on Hover */}
                          <motion.div
                            className="absolute inset-0 rounded-lg border border-blue-500/0 group-hover:border-blue-500/30 transition-colors pointer-events-none"
                            initial={false}
                            animate={{ borderColor: "rgba(59, 130, 246, 0)" }}
                          />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onPaste={handlePaste}
                    className="relative z-10 min-h-40 w-full resize-none rounded-xl bg-slate-900/50 text-sm font-medium text-slate-100 outline-none placeholder:text-slate-600 transition-all duration-300 border border-slate-700/50 px-4 py-3 focus:border-blue-500/60 focus:shadow-lg focus:shadow-blue-500/20 focus:ring-2 focus:ring-blue-400/30"
                    placeholder="https://youtube.com/watch?v=... or https://example.com"
                  />

                  {/* Detected Type Badge */}
                  {input.trim() && detectedType !== "note" ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-6 right-6 rounded-lg border border-blue-500/30 bg-blue-900/40 px-4 py-2 text-xs font-semibold text-blue-200 backdrop-blur-sm flex items-center gap-2"
                    >
                      <Check size={14} />
                      <span>
                        Detected:{" "}
                        <span className="text-blue-300 font-bold">
                          {getDetectedLabel()}
                        </span>
                      </span>
                    </motion.div>
                  ) : null}

                  {/* Pasted Animation */}
                  <AnimatePresence>
                    {showPastedAnimation && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-2 text-xs font-bold text-white shadow-xl shadow-emerald-500/30"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6 }}
                        >
                          <Check size={14} />
                        </motion.div>
                        Pasted!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              // Content Preview State
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Add Another Source Section */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-950/40 p-6 backdrop-blur-sm">
                  {linkSources.length < MAX_LINKS && (
                    <div className="mb-6 flex flex-col gap-3 border-b border-slate-700/40 pb-6 sm:flex-row sm:items-end sm:gap-4">
                      <div className="flex-1">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
                          Add another source
                        </label>
                        <input
                          type="url"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onPaste={handlePaste}
                          className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-100 outline-none placeholder:text-slate-600 transition-all duration-300 focus:border-blue-500/60 focus:shadow-lg focus:shadow-blue-500/20 focus:ring-2 focus:ring-blue-400/30"
                          placeholder="https://youtube.com/watch?v=... or https://example.com"
                        />
                      </div>
                      <motion.button
                        type="submit"
                        disabled={isParsing || !input.trim()}
                        className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-300 ${
                          isParsing || !input.trim()
                            ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/30 hover:from-blue-500 hover:to-blue-600"
                        }`}
                        whileHover={
                          isParsing || !input.trim() ? {} : { scale: 1.05 }
                        }
                        whileTap={
                          isParsing || !input.trim() ? {} : { scale: 0.95 }
                        }
                      >
                        {isParsing ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Loader2 size={16} />
                            </motion.div>
                            <span>Parsing…</span>
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            <span>Add link</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}

                  {/* Source Type Filters */}
                  <div className="mb-6 space-y-5">
                    {/* Videos Section */}
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-rose-400/80 flex items-center gap-2">
                        <Video size={14} />
                        Videos
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sortedLinks.filter((l) => l.sourceType === "video")
                          .length > 0 ? (
                          sortedLinks
                            .filter((l) => l.sourceType === "video")
                            .map((link) => (
                              <motion.button
                                key={link.id}
                                type="button"
                                onClick={() => setSelectedLinkId(link.id)}
                                layout
                                className={`max-w-full truncate rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                                  selectedLink?.id === link.id
                                    ? "border-rose-400/50 bg-rose-500/20 text-rose-100 shadow-lg shadow-rose-500/20"
                                    : "border-slate-600/60 bg-slate-800/40 text-slate-300 hover:border-rose-400/30 hover:bg-slate-800/60 hover:text-slate-100"
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title={link.url}
                              >
                                {link.videoTitle ?? "Video"}
                              </motion.button>
                            ))
                        ) : (
                          <span className="text-xs text-slate-600 italic">
                            No video sources
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Articles Section */}
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-400/80 flex items-center gap-2">
                        <Globe size={14} />
                        Articles
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sortedLinks.filter((l) => l.sourceType === "article")
                          .length > 0 ? (
                          sortedLinks
                            .filter((l) => l.sourceType === "article")
                            .map((link) => (
                              <motion.button
                                key={link.id}
                                type="button"
                                onClick={() => setSelectedLinkId(link.id)}
                                layout
                                className={`max-w-full truncate rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                                  selectedLink?.id === link.id
                                    ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100 shadow-lg shadow-cyan-500/20"
                                    : "border-slate-600/60 bg-slate-800/40 text-slate-300 hover:border-cyan-400/30 hover:bg-slate-800/60 hover:text-slate-100"
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title={link.url}
                              >
                                {link.title ?? "Article"}
                              </motion.button>
                            ))
                        ) : (
                          <span className="text-xs text-slate-600 italic">
                            No article sources
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Preview Area */}
                  <div className="relative min-h-[250px] overflow-x-clip overflow-y-visible rounded-xl border border-slate-700/50 bg-slate-900/60 p-6 backdrop-blur-sm">
                    <AnimatePresence mode="wait">
                      {selectedLink ? (
                        <motion.div
                          key={selectedLink.id}
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -30, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 30,
                          }}
                          className="space-y-5"
                        >
                          {selectedLink.sourceType === "video" ? (
                            <div className="space-y-5">
                              <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                  Video Title
                                </p>
                                <p className="text-sm font-semibold text-slate-100 break-words">
                                  {selectedLink.videoTitle}
                                </p>
                              </div>
                              <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                  Channel
                                </p>
                                <p className="text-sm text-slate-200">
                                  {selectedLink.channelName}
                                </p>
                              </div>
                              {selectedLink.transcriptError && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3"
                                  role="alert"
                                >
                                  <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                  </div>
                                  <p className="text-sm text-red-200">
                                    {selectedLink.transcriptError}
                                  </p>
                                </motion.div>
                              )}
                              {selectedLink.transcript &&
                                !selectedLink.transcriptError && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-2"
                                  >
                                    <Check
                                      size={16}
                                      className="text-emerald-400"
                                    />
                                    <p className="text-xs font-medium text-emerald-200">
                                      Transcript loaded (
                                      {selectedLink.transcriptLanguage ??
                                        "unknown"}
                                      {selectedLink.transcriptIsGenerated
                                        ? ", auto-generated"
                                        : ""}
                                      )
                                    </p>
                                  </motion.div>
                                )}
                            </div>
                          ) : (
                            <div className="space-y-5">
                              <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                  Title
                                </p>
                                <p className="text-sm font-semibold text-slate-100">
                                  {selectedLink.title}
                                </p>
                              </div>
                              <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                  URL
                                </p>
                                <p className="text-xs break-all text-cyan-300/90 font-mono">
                                  {selectedLink.url}
                                </p>
                              </div>
                              {(selectedLink.cleanedParagraphs ?? []).length >
                                0 && (
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                                    Content Preview
                                  </p>
                                  <div className="space-y-3">
                                    {(selectedLink.cleanedParagraphs ?? [])
                                      .slice(0, 3)
                                      .map((para, i) => (
                                        <p
                                          key={i}
                                          className="text-sm leading-relaxed text-slate-300 line-clamp-2 rounded-lg border border-slate-700/30 bg-slate-800/20 p-3"
                                        >
                                          {para}
                                        </p>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <div className="flex h-32 items-center justify-center">
                          <p className="text-sm text-slate-500">
                            Select a source to preview
                          </p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Add Another Source Button - Bottom */}
                  {linkSources.length < MAX_LINKS && (
                    <div className="mt-6 flex gap-3 border-t border-slate-700/30 pt-6 flex-col sm:flex-row">
                      <input
                        type="url"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handlePaste}
                        className="flex-1 rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-100 outline-none placeholder:text-slate-600 transition-all duration-300 focus:border-blue-500/60 focus:shadow-lg focus:shadow-blue-500/20 focus:ring-2 focus:ring-blue-400/30"
                        placeholder="https://youtube.com/watch?v=... or https://example.com"
                      />
                      <motion.button
                        type="submit"
                        disabled={isParsing || !input.trim()}
                        className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-300 ${
                          isParsing || !input.trim()
                            ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/30 hover:from-blue-500 hover:to-blue-600"
                        }`}
                        whileHover={
                          isParsing || !input.trim() ? {} : { scale: 1.05 }
                        }
                        whileTap={
                          isParsing || !input.trim() ? {} : { scale: 0.95 }
                        }
                      >
                        {isParsing ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Loader2 size={16} />
                            </motion.div>
                            <span>Parsing…</span>
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            <span>Add link</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Initial Form Submit Button */}
            {!showContentPreview && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-sm font-medium text-slate-400">
                  {input.trim()
                    ? detectedType === "note"
                      ? "⚠️ Plain text is not supported. Please paste a valid URL."
                      : `✓ Ready to add: ${detectedType === "video" ? "YouTube video" : "website article"}`
                    : "👉 Paste a URL to begin"}
                </p>
                <motion.button
                  type="submit"
                  disabled={
                    isParsing || !input.trim() || detectedType === "note"
                  }
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white transition-all duration-300 ${
                    isParsing || !input.trim() || detectedType === "note"
                      ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-xl hover:shadow-blue-500/30 hover:from-blue-500 hover:to-blue-600"
                  }`}
                  whileHover={
                    isParsing || !input.trim() || detectedType === "note"
                      ? {}
                      : { scale: 1.05, y: -2 }
                  }
                  whileTap={
                    isParsing || !input.trim() || detectedType === "note"
                      ? {}
                      : { scale: 0.95 }
                  }
                >
                  {isParsing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Loader2 size={18} />
                      </motion.div>
                      <span>Parsing…</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Add link</span>
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </form>
        </motion.div>

        {/* Right Sidebar - Session Sources */}
        <motion.aside
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="flex flex-col rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-950/60 p-8 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-slate-700/60"
        >
          <div className="mb-6 space-y-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Session Sources
            </h3>
            <p className="text-xs text-slate-500">
              {linkSources.length} of {MAX_LINKS} added
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-start gap-3"
              role="alert"
            >
              <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
              </div>
              <span>{error}</span>
            </motion.div>
          )}

          {/* Sources List */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {linkSources.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-40 items-center justify-center"
              >
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <div className="rounded-lg bg-slate-700/30 p-3 border border-slate-700/50">
                      <Globe size={24} className="text-slate-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    No sources yet
                  </p>
                  <p className="text-xs text-slate-600">
                    Add a source to get started
                  </p>
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                <ul className="space-y-3">
                  {sortedLinks.map((source) => (
                    <motion.li
                      key={source.id}
                      layout
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -50, opacity: 0, scale: 0.8 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 28,
                      }}
                      className="group rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/20 p-4 transition-all duration-300 hover:border-slate-600/70 hover:bg-gradient-to-br hover:from-slate-800/60 hover:to-slate-900/40 hover:shadow-lg hover:shadow-slate-950/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-3 pt-0.5">
                          <div className="flex-shrink-0 pt-1">
                            {typeIcon(source.sourceType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                {source.sourceType}
                              </span>
                              {source.sourceType === "video" &&
                                source.transcript && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <Check size={12} />
                                    Loaded
                                  </span>
                                )}
                            </div>
                            <p className="line-clamp-2 text-xs text-slate-300 break-words">
                              {source.sourceType === "video"
                                ? source.videoTitle
                                : source.title}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => handleDeleteSource(source.id)}
                          className="flex-shrink-0 rounded-lg p-2 text-slate-500 opacity-0 transition-all duration-300 hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                          aria-label={`Remove ${source.sourceType}`}
                          whileHover={{ scale: 1.2, rotate: 10 }}
                          whileTap={{ scale: 0.9, rotate: -10 }}
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </AnimatePresence>
            )}
          </div>

          {/* Footer Stats */}
          {linkSources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-3 border-t border-slate-700/30 pt-5"
            >
              <div className="rounded-lg bg-slate-800/30 border border-slate-700/40 p-3 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                  Ready to generate
                </p>
                <p className="text-xs text-slate-500">
                  {linkSources.length} source
                  {linkSources.length !== 1 ? "s" : ""} will be sent to backend
                </p>
              </div>
            </motion.div>
          )}
        </motion.aside>
      </section>

      {/* Exam Notes Modal */}
      <AnimatePresence>
        {ragModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={() => setRagModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-700/40 bg-gradient-to-r from-slate-900/80 to-slate-950/80 px-8 py-6 backdrop-blur-sm">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-100">
                    Generated Exam Notes
                  </h2>
                  {ragModel && (
                    <p className="text-xs text-slate-500">
                      Generated with{" "}
                      <span className="text-violet-300 font-semibold">
                        {ragModel}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob([ragMarkdown], {
                        type: "text/plain",
                      });
                      element.href = URL.createObjectURL(file);
                      element.download = "exam-notes.txt";
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/40 hover:from-emerald-500 hover:to-teal-500"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title="Download as text file"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>Download</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setRagModalOpen(false)}
                    className="rounded-lg p-2.5 text-slate-400 transition-all duration-300 hover:bg-slate-800/60 hover:text-slate-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Close modal"
                  >
                    <X size={24} />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content - Notes Display */}
              <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                <div className="prose prose-invert max-w-none space-y-6">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => (
                        <h1
                          className="mt-10 mb-6 text-3xl font-bold text-blue-300"
                          {...props}
                        />
                      ),
                      h2: ({ ...props }) => (
                        <h2
                          className="mt-8 mb-4 text-2xl font-bold text-violet-300 flex items-center gap-3"
                          {...props}
                        >
                          <span className="inline-block h-1 w-1 rounded-full bg-violet-400" />
                          {props.children}
                        </h2>
                      ),
                      h3: ({ ...props }) => (
                        <h3
                          className="mt-6 mb-3 text-lg font-bold text-slate-100"
                          {...props}
                        />
                      ),
                      p: ({ ...props }) => (
                        <p
                          className="mb-4 leading-relaxed text-slate-300 text-base"
                          {...props}
                        />
                      ),
                      ul: ({ ...props }) => (
                        <ul
                          className="mb-4 list-inside list-disc space-y-2 text-slate-300 ml-2"
                          {...props}
                        />
                      ),
                      ol: ({ ...props }) => (
                        <ol
                          className="mb-4 list-inside list-decimal space-y-2 text-slate-300 ml-2"
                          {...props}
                        />
                      ),
                      li: ({ ...props }) => (
                        <li className="text-slate-300 text-base" {...props} />
                      ),
                      strong: ({ ...props }) => (
                        <strong
                          className="font-bold text-emerald-300"
                          {...props}
                        />
                      ),
                      em: ({ ...props }) => (
                        <em className="italic text-cyan-200" {...props} />
                      ),
                      code: ({
                        inline,
                        children,
                        ...props
                      }: {
                        inline?: boolean;
                        children?: React.ReactNode;
                      } & React.HTMLAttributes<HTMLElement>) =>
                        inline ? (
                          <code
                            className="rounded bg-slate-800/80 px-2 py-1 font-mono text-sm text-rose-200 border border-slate-700/50"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-slate-800/80 text-rose-200 p-4 rounded font-mono text-sm overflow-x-auto my-4 border border-slate-700/50">
                            <code {...props}>{children}</code>
                          </pre>
                        ),
                      blockquote: ({ ...props }) => (
                        <blockquote
                          className="border-l-4 border-violet-500/50 bg-violet-500/10 pl-4 py-2 italic text-slate-300 my-4"
                          {...props}
                        />
                      ),
                      hr: () => <hr className="my-6 border-slate-700" />,
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

      {/* Rate Limit Error Fallback */}
      <AnimatePresence>
        {rateLimitError && (
          <RateLimitFallback
            retryAfter={rateLimitError.retryAfter}
            retryAt={rateLimitError.retryAt}
            message={rateLimitError.message}
            onRetry={handleRateLimitRetry}
          />
        )}
      </AnimatePresence>
    </>
  );
}
