"use client";

import { useState } from "react";
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
  ChevronRight,
  Info,
  AlertTriangle,
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-950/80 p-8 shadow-2xl backdrop-blur-xl overflow-hidden min-h-96"
    >
      {/* Animated background gradient - enhanced */}
      <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/30 to-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-500/20 to-violet-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(0deg, transparent 24%, rgba(148, 163, 184, 0.05) 25%, rgba(148, 163, 184, 0.05) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.05) 75%, rgba(148, 163, 184, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(148, 163, 184, 0.05) 25%, rgba(148, 163, 184, 0.05) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.05) 75%, rgba(148, 163, 184, 0.05) 76%, transparent 77%, transparent)",
          backgroundSize: "50px 50px",
        }}
      />

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
              {/* Header Section */}
              <div className="text-center mb-10">
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
                            scale: [1, 1.08, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(168, 85, 247, 0.4)",
                              "0 0 0 25px rgba(168, 85, 247, 0)",
                              "0 0 0 0 rgba(168, 85, 247, 0)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="relative p-5 rounded-2xl bg-gradient-to-br from-violet-500/30 to-indigo-500/20 border border-violet-500/40 shadow-lg shadow-violet-500/20"
                  >
                    <FileText
                      size={56}
                      className="text-violet-300"
                      strokeWidth={1.5}
                    />
                  </motion.div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-3"
                >
                  Generate Study Report
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="text-slate-400 text-base leading-relaxed"
                >
                  {hasContent
                    ? `Transform your ${sourcesCount} source${
                        sourcesCount !== 1 ? "s" : ""
                      } into a comprehensive, well-structured study document`
                    : "Add sources in the Notes tab to generate a comprehensive study report"}
                </motion.p>
              </div>

              {/* Error Display - Enhanced */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-8 p-4 rounded-xl border border-red-600/40 bg-gradient-to-br from-red-950/60 to-red-900/40 backdrop-blur flex items-start gap-4 shadow-lg shadow-red-500/10"
                >
                  <div className="flex-shrink-0 mt-1">
                    <AlertCircle
                      size={20}
                      className="text-red-400 animate-pulse"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-200">
                      Error generating report
                    </p>
                    <p className="text-xs text-red-300/80 mt-1 leading-relaxed break-words">
                      {error instanceof Error ? error.message : "Unknown error"}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Form Section */}
              {hasContent && (
                <motion.form
                  onSubmit={handleGenerateReport}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6 mb-8"
                >
                  {/* Title Input */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-sm font-semibold text-slate-200 mb-3">
                      <span className="flex items-center gap-2">
                        Report Title
                        <span className="text-xs font-normal text-slate-500">
                          (optional)
                        </span>
                      </span>
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={reportTitle}
                        onChange={(e) =>
                          setReportTitle(e.target.value.slice(0, 255))
                        }
                        placeholder="e.g., Quantum Physics Study Guide"
                        disabled={isGenerating}
                        maxLength={255}
                        className="w-full px-5 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-violet-500/80 focus:ring-2 focus:ring-violet-500/20 focus:bg-slate-800/80 hover:border-slate-600/80 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/0 to-indigo-500/0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity" />
                    </div>
                    {reportTitle && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-slate-400 mt-2 flex items-center gap-1"
                      >
                        <span>{reportTitle.length}</span>
                        <span className="text-slate-600">/</span>
                        <span>255</span>
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Prompt Textarea */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-sm font-semibold text-slate-200 mb-3">
                      <span className="flex items-center gap-2">
                        <Info size={16} className="text-violet-400" />
                        Report Instructions
                      </span>
                    </label>
                    <div className="relative group">
                      <textarea
                        value={reportPrompt}
                        onChange={(e) =>
                          setReportPrompt(e.target.value.slice(0, 5000))
                        }
                        placeholder="Describe what you want in your report: key concepts, examples, practice questions, etc."
                        rows={5}
                        disabled={isGenerating}
                        maxLength={5000}
                        className="w-full px-5 py-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-violet-500/80 focus:ring-2 focus:ring-violet-500/20 focus:bg-slate-800/80 hover:border-slate-600/80 disabled:opacity-50 disabled:cursor-not-allowed resize-none text-base leading-relaxed font-normal"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/0 to-indigo-500/0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity" />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-slate-400">
                        Be specific for better results
                      </p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-slate-400"
                      >
                        <span
                          className={
                            reportPrompt.length > 4500
                              ? "text-orange-400"
                              : "text-slate-500"
                          }
                        >
                          {reportPrompt.length}
                        </span>
                        <span className="text-slate-600">/</span>
                        <span>5000</span>
                      </motion.p>
                    </div>
                  </motion.div>

                  {/* Submit Button - Enhanced */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pt-4"
                  >
                    <motion.button
                      type="submit"
                      disabled={isGenerating || !hasContent}
                      whileHover={
                        !isGenerating && hasContent
                          ? { scale: 1.01, y: -2 }
                          : {}
                      }
                      whileTap={
                        !isGenerating && hasContent ? { scale: 0.99, y: 0 } : {}
                      }
                      className={`w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 relative overflow-hidden group ${
                        isGenerating || !hasContent
                          ? "bg-slate-700 text-slate-400 cursor-not-allowed shadow-md"
                          : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 active:shadow-md"
                      }`}
                    >
                      {/* Animated background on hover */}
                      {!isGenerating && hasContent && (
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                      )}

                      <span className="relative flex items-center gap-3">
                        {isGenerating ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <Loader2 size={22} />
                            </motion.div>
                            <span>Generating Report...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={22} />
                            <span>Generate Report</span>
                            {hasContent && !isGenerating && (
                              <ChevronRight
                                size={18}
                                className="group-hover:translate-x-1 transition-transform"
                              />
                            )}
                          </>
                        )}
                      </span>
                    </motion.button>
                  </motion.div>
                </motion.form>
              )}

              {!hasContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-slate-700/50 bg-slate-800/30"
                >
                  <AlertTriangle size={36} className="text-slate-500 mb-3" />
                  <p className="text-center text-sm text-slate-400">
                    Add sources in the Notes tab to generate a report
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {view === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              {/* Animated loading icon */}
              <motion.div className="mb-8 relative w-24 h-24">
                {/* Outer rotating circle */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-400 border-r-violet-400/50"
                />

                {/* Middle rotating circle (opposite direction) */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border-2 border-transparent border-b-indigo-400 border-l-indigo-400/50"
                />

                {/* Center icon */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-6 flex items-center justify-center"
                >
                  <Sparkles size={32} className="text-violet-300" />
                </motion.div>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-slate-100 mb-2"
              >
                Generating Your Report
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 text-center max-w-sm leading-relaxed"
              >
                We're analyzing your sources and creating a comprehensive study
                guide. This may take a moment.
              </motion.p>

              {/* Progress dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex gap-2 mt-8"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400"
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {view === "preview" && report && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between mb-8 pb-6 border-b border-slate-700/50"
              >
                <div className="flex-1">
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2"
                  >
                    {report.title || "Study Report"}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-slate-400"
                  >
                    Generated on{" "}
                    <span className="text-slate-300 font-medium">
                      {new Date(report.timestamp).toLocaleString()}
                    </span>
                  </motion.p>
                </div>

                {/* Back Button */}
                <motion.button
                  onClick={handleGenerateNew}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 hover:border-slate-600/50 transition-all text-slate-400 hover:text-slate-200 shadow-md hover:shadow-lg"
                  title="Generate new report"
                >
                  <ArrowLeft size={20} />
                </motion.button>
              </motion.div>

              {/* Action Buttons - Enhanced */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-3 mb-8 flex-wrap"
              >
                {/* Copy Button */}
                <motion.button
                  onClick={handleCopyToClipboard}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95, y: 0 }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-200 border shadow-md hover:shadow-lg ${
                    copied
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-500/50 text-white shadow-emerald-500/20"
                      : "bg-slate-800/60 border-slate-700/60 hover:border-slate-600/80 text-slate-300 hover:text-slate-100"
                  }`}
                >
                  {copied ? (
                    <>
                      <motion.div animate={{ scale: [1, 1.2, 1] }}>
                        <Check size={18} />
                      </motion.div>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      <span>Copy</span>
                    </>
                  )}
                </motion.button>

                {/* Download Button */}
                <motion.button
                  onClick={handleDownloadReport}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95, y: 0 }}
                  className="flex items-center gap-2 px-5 py-3 rounded-lg font-medium bg-slate-800/60 border border-slate-700/60 hover:border-slate-600/80 text-slate-300 hover:text-slate-100 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Download size={18} />
                  <span>Download</span>
                </motion.button>

                {/* Generate New Button */}
                <motion.button
                  onClick={handleGenerateNew}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95, y: 0 }}
                  className="ml-auto flex items-center gap-2 px-5 py-3 rounded-lg font-medium bg-gradient-to-r from-violet-600 to-indigo-600 border border-violet-500/50 text-white transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 group"
                >
                  <Sparkles size={18} />
                  <span>Generate New</span>
                  <ChevronRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </motion.button>
              </motion.div>

              {/* Report Content - Enhanced */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800/50 to-slate-900/30 p-8 shadow-lg max-h-[600px] overflow-y-auto"
              >
                {/* Custom scrollbar styling */}
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 8px;
                  }
                  div::-webkit-scrollbar-track {
                    background: rgba(51, 65, 85, 0.3);
                    border-radius: 10px;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.4);
                    border-radius: 10px;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.6);
                  }
                `}</style>

                <div className="prose prose-invert max-w-none text-base">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => (
                        <h1
                          className="text-3xl font-bold bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent mt-8 mb-4 first:mt-0"
                          {...props}
                        />
                      ),
                      h2: ({ ...props }) => (
                        <h2
                          className="text-2xl font-bold text-violet-300 mt-7 mb-4 pb-2 border-b border-violet-500/30"
                          {...props}
                        />
                      ),
                      h3: ({ ...props }) => (
                        <h3
                          className="text-xl font-semibold text-violet-200 mt-6 mb-3"
                          {...props}
                        />
                      ),
                      p: ({ ...props }) => (
                        <p
                          className="text-slate-300 mb-4 leading-relaxed"
                          {...props}
                        />
                      ),
                      ul: ({ ...props }) => (
                        <ul
                          className="list-disc list-inside space-y-2 mb-4 text-slate-300 pl-2"
                          {...props}
                        />
                      ),
                      ol: ({ ...props }) => (
                        <ol
                          className="list-decimal list-inside space-y-2 mb-4 text-slate-300 pl-2"
                          {...props}
                        />
                      ),
                      li: ({ ...props }) => (
                        <li className="text-slate-300 mb-1" {...props} />
                      ),
                      strong: ({ ...props }) => (
                        <strong
                          className="font-semibold text-violet-200"
                          {...props}
                        />
                      ),
                      em: ({ ...props }) => (
                        <em className="italic text-slate-300" {...props} />
                      ),
                      code: ({ ...props }) => (
                        <code
                          className="bg-slate-900/80 px-3 py-1 rounded-md text-sm font-mono text-violet-200 border border-slate-700/50 inline-block"
                          {...props}
                        />
                      ),
                      blockquote: ({ ...props }) => (
                        <blockquote
                          className="border-l-4 border-violet-500/60 pl-4 italic text-slate-400 my-4 bg-slate-800/40 py-2 pr-4 rounded-r-lg"
                          {...props}
                        />
                      ),
                      table: ({ ...props }) => (
                        <table
                          className="w-full border-collapse text-sm my-4"
                          {...props}
                        />
                      ),
                      th: ({ ...props }) => (
                        <th
                          className="border border-slate-700/50 px-3 py-2 bg-slate-800/50 text-violet-200 font-semibold"
                          {...props}
                        />
                      ),
                      td: ({ ...props }) => (
                        <td
                          className="border border-slate-700/50 px-3 py-2 text-slate-300"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {report.content}
                  </ReactMarkdown>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
