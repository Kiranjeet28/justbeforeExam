"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sparkles,
  Loader2,
  Copy,
  Download,
  AlertCircle,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useGenerateReport } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";
import { APIError, RateLimitError, ValidationError } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface ReportTabProps {
  sourcesCount: number;
}

type ViewType = "form" | "preview" | "loading";

export default function ReportTab({ sourcesCount }: ReportTabProps) {
  const {
    mutate: generateReport,
    loading,
    error,
    data: report,
    reset: resetReport,
  } = useGenerateReport();
  const { showSuccess, showError, showWarning } = useToast();

  const [view, setView] = useState<ViewType>("form");
  const [reportPrompt, setReportPrompt] = useState(
    "Create a comprehensive study guide with key concepts, important formulas, practice questions, and exam tips.",
  );
  const [reportTitle, setReportTitle] = useState("");
  const [copied, setCopied] = useState(false);

  const hasContent = sourcesCount > 0;
  const isGenerating = loading;

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportPrompt.trim()) {
      showError("Please enter instructions for the report");
      return;
    }

    if (reportPrompt.length > 5000) {
      showError("Report instructions must be less than 5000 characters");
      return;
    }

    try {
      setView("loading");
      const result = await generateReport({
        sourceIds: "all",
        prompt: reportPrompt,
        title:
          reportTitle || `Study Report - ${new Date().toLocaleDateString()}`,
        save: true,
      });

      if (result) {
        showSuccess("Report generated successfully!");
        setView("preview");
      }
    } catch (err) {
      setView("form");
      if (err instanceof RateLimitError) {
        showWarning(`Rate limited. Please retry in ${err.retryAfter} seconds.`);
      } else if (err instanceof ValidationError) {
        showError(`Validation error: ${err.message}`);
      } else if (err instanceof APIError) {
        showError(
          err.message || "Failed to generate report. Please try again.",
        );
      } else {
        showError(
          err instanceof Error ? err.message : "Unknown error occurred",
        );
      }
    }
  };

  const handleCopyToClipboard = async () => {
    if (!report?.content) return;

    try {
      await navigator.clipboard.writeText(report.content);
      setCopied(true);
      showSuccess("Report copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError("Failed to copy to clipboard");
    }
  };

  const handleDownloadReport = () => {
    if (!report?.content) return;

    const filename = `${
      report.title || "study-report"
    }-${new Date().toISOString().split("T")[0]}.md`;
    const blob = new Blob([report.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess("Report downloaded!");
  };

  const handleGenerateNew = () => {
    resetReport();
    setReportPrompt(
      "Create a comprehensive study guide with key concepts, important formulas, practice questions, and exam tips.",
    );
    setReportTitle("");
    setView("form");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 via-slate-900/30 to-slate-950/50 p-8 shadow-xl backdrop-blur-sm overflow-hidden relative min-h-96"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/20 to-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {view === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mb-6 flex justify-center"
                >
                  <motion.div
                    animate={
                      hasContent
                        ? {
                            scale: [1, 1.05, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(168, 85, 247, 0)",
                              "0 0 0 20px rgba(168, 85, 247, 0)",
                              "0 0 0 0 rgba(168, 85, 247, 0)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative p-6 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30"
                  >
                    <FileText
                      size={56}
                      className="text-violet-300"
                      strokeWidth={1.5}
                    />
                  </motion.div>
                </motion.div>

                <h2 className="text-3xl font-bold text-slate-100 mb-3">
                  Generate Your Study Report
                </h2>
                <p className="text-slate-400 text-lg mb-6">
                  {hasContent
                    ? `Transform your ${sourcesCount} source${
                        sourcesCount !== 1 ? "s" : ""
                      } into a comprehensive study document`
                    : "Add sources in the Notes tab to generate a report"}
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-lg border border-red-700/50 bg-red-950/20 flex items-start gap-3"
                >
                  <AlertCircle
                    size={20}
                    className="text-red-400 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-red-200">
                      Error generating report
                    </p>
                    <p className="text-xs text-red-300 mt-1">
                      {error instanceof Error ? error.message : "Unknown error"}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Form */}
              {hasContent && (
                <form
                  onSubmit={handleGenerateReport}
                  className="space-y-4 mb-6"
                >
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Report Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) =>
                        setReportTitle(e.target.value.slice(0, 255))
                      }
                      placeholder="e.g., Quantum Physics Study Guide"
                      className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isGenerating}
                      maxLength={255}
                    />
                    {reportTitle && (
                      <p className="text-xs text-slate-400 mt-1">
                        {reportTitle.length}/255
                      </p>
                    )}
                  </div>

                  {/* Prompt Textarea */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Report Instructions
                    </label>
                    <textarea
                      value={reportPrompt}
                      onChange={(e) =>
                        setReportPrompt(e.target.value.slice(0, 5000))
                      }
                      placeholder="Describe what you want in your report..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isGenerating}
                      maxLength={5000}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {reportPrompt.length}/5000
                    </p>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isGenerating || !hasContent}
                    whileHover={
                      !isGenerating && hasContent ? { scale: 1.02 } : {}
                    }
                    whileTap={
                      !isGenerating && hasContent ? { scale: 0.98 } : {}
                    }
                    className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                      isGenerating || !hasContent
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-violet-500/30"
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Generate Report
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {!hasContent && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-slate-500"
                >
                  ✨ Add sources in the Notes tab to begin
                </motion.p>
              )}
            </motion.div>
          )}

          {view === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <Sparkles size={48} className="text-violet-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-slate-100 mb-2">
                Generating your report...
              </h3>
              <p className="text-slate-400 text-center max-w-sm">
                This may take a moment. We're analyzing your sources and
                creating a comprehensive study guide.
              </p>
            </motion.div>
          )}

          {view === "preview" && report && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-100 mb-1">
                    {report.title || "Study Report"}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Generated {new Date(report.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={handleGenerateNew}
                  className="p-2 hover:bg-slate-800/50 rounded-lg transition text-slate-400 hover:text-slate-200"
                  title="Generate new report"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-6">
                <motion.button
                  onClick={handleCopyToClipboard}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition text-slate-300 hover:text-slate-100"
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={handleDownloadReport}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition text-slate-300 hover:text-slate-100"
                >
                  <Download size={18} />
                  Download
                </motion.button>

                <motion.button
                  onClick={handleGenerateNew}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-indigo-500/20 hover:from-violet-500/30 hover:to-indigo-500/30 border border-violet-500/30 transition text-violet-300 hover:text-violet-200"
                >
                  <Sparkles size={18} />
                  Generate New
                </motion.button>
              </div>

              {/* Report Content */}
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-700/50 bg-slate-800/30 p-6 prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ ...props }) => (
                      <h1
                        className="text-2xl font-bold text-violet-300 mt-6 mb-3 first:mt-0"
                        {...props}
                      />
                    ),
                    h2: ({ ...props }) => (
                      <h2
                        className="text-xl font-bold text-violet-300 mt-5 mb-3"
                        {...props}
                      />
                    ),
                    h3: ({ ...props }) => (
                      <h3
                        className="text-lg font-semibold text-violet-200 mt-4 mb-2"
                        {...props}
                      />
                    ),
                    p: ({ ...props }) => (
                      <p
                        className="text-slate-300 mb-3 leading-relaxed"
                        {...props}
                      />
                    ),
                    ul: ({ ...props }) => (
                      <ul
                        className="list-disc list-inside space-y-2 mb-3 text-slate-300"
                        {...props}
                      />
                    ),
                    ol: ({ ...props }) => (
                      <ol
                        className="list-decimal list-inside space-y-2 mb-3 text-slate-300"
                        {...props}
                      />
                    ),
                    li: ({ ...props }) => (
                      <li className="text-slate-300" {...props} />
                    ),
                    strong: ({ ...props }) => (
                      <strong
                        className="font-semibold text-violet-200"
                        {...props}
                      />
                    ),
                    code: ({ ...props }) => (
                      <code
                        className="bg-slate-900 px-2 py-1 rounded text-sm font-mono text-violet-200"
                        {...props}
                      />
                    ),
                    blockquote: ({ ...props }) => (
                      <blockquote
                        className="border-l-4 border-violet-500/50 pl-4 italic text-slate-400 my-3"
                        {...props}
                      />
                    ),
                  }}
                >
                  {report.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
