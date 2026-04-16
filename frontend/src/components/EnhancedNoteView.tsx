"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  Copy,
  X,
  AlertCircle,
  Loader,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotesView } from "./views";

export type ViewType = "notes";

interface EnhancedNoteViewProps {
  noteData: string;
  isLoading?: boolean;
  error?: string | null;
  onClose?: () => void;
  title?: string;
}

export default function EnhancedNoteView({
  noteData,
  isLoading = false,
  error = null,
  onClose,
  title = "Enhanced Notes",
}: EnhancedNoteViewProps) {
  const [currentView, setCurrentView] = useState<ViewType>("notes");
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(noteData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleExport = async (format: "pdf" | "markdown") => {
    try {
      switch (format) {
        case "markdown":
          exportAsMarkdown();
          break;
        case "pdf":
          exportAsPDF();
          break;
      }
      setExportOpen(false);
    } catch (err) {
      console.error(`Export failed:`, err);
    }
  };

  const exportAsMarkdown = () => {
    const blob = new Blob([noteData], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-notes-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(
        `<!DOCTYPE html>
    <html>
      <head>
        <title>Exam Notes</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
          h1, h2, h3 { color: #333; margin-top: 1.5em; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
          pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
          ul, ol { margin: 10px 0; padding-left: 20px; }
          blockquote { border-left: 4px solid #007bff; padding-left: 12px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div>${noteData.replace(/\n/g, "<br/>")}</div>
        <script>
          window.print();
          window.close();
        </script>
      </body>
    </html>`,
      );
      printWindow.document.close();
    }
  };
  const renderView = () => {
    return <NotesView content={noteData} />;
  };

  const getExportFormats = (): Array<{
    format: "pdf" | "markdown";
    label: string;
  }> => {
    return [
      { format: "markdown", label: "Markdown" },
      { format: "pdf", label: "PDF" },
    ];
  };

  // Loading State
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-gradient-to-br from-slate-800 via-slate-900 to-black border border-slate-700/50 rounded-2xl p-8 shadow-2xl backdrop-blur-xl max-w-sm"
        >
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-violet-400"
            >
              <Loader size={48} />
            </motion.div>
            <div className="text-center space-y-2">
              <p className="text-slate-100 font-semibold">
                Processing your notes...
              </p>
              <p className="text-slate-400 text-sm">
                Generating enhanced study materials
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Error State
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-gradient-to-br from-slate-800 via-slate-900 to-black border border-red-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl max-w-md"
        >
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="text-red-400" size={28} />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-red-300 font-semibold text-lg">Error</h3>
              <p className="text-slate-300">{error}</p>
              {onClose && (
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all duration-200 font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Main View
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-800 via-slate-900 to-black border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col backdrop-blur-xl"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between p-6 border-b border-slate-700/30 bg-gradient-to-r from-slate-800/50 to-slate-900/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-lg">
              <FileText className="text-violet-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              {title}
            </h2>
          </div>
          {onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-700/30 transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </motion.button>
          )}
        </motion.div>

        {/* View Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 p-4 border-b border-slate-700/30 bg-slate-900/20 overflow-x-auto"
        >
          {[
            { id: "notes" as const, label: "Notes", icon: FileText },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${currentView === tab.id
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30"
                : "bg-slate-700/20 text-slate-300 hover:bg-slate-700/40 hover:text-slate-200"
                }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {currentView === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 to-indigo-400"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Toolbar with Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-3 p-4 border-b border-slate-700/30 bg-slate-900/20 items-center justify-between backdrop-blur-sm"
        >
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyToClipboard}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${copied
                ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/30"
                : "bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:text-slate-100"
                }`}
            >
              <motion.div
                animate={{ rotate: copied ? 360 : 0 }}
                transition={{ duration: 0.4 }}
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              </motion.div>
              <span>{copied ? "Copied!" : "Copy"}</span>
            </motion.button>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:text-slate-100"
              >
                <Download size={18} />
                <span>Export</span>
                <motion.div
                  animate={{ rotate: exportOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {exportOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute top-full mt-2 left-0 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden backdrop-blur-xl z-10"
                  >
                    {getExportFormats().map((item, idx) => (
                      <motion.button
                        key={item.format}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleExport(item.format)}
                        className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                      >
                        <Download size={16} />
                        Export {item.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-slate-400"
          >
            {noteData.length.toLocaleString()} characters
          </motion.div>
        </motion.div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {noteData ? (
              <div className="prose prose-invert max-w-none">
                {renderView()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-slate-700/20 rounded-full mb-4">
                  <FileText className="text-slate-400" size={32} />
                </div>
                <p className="text-slate-400 text-lg">No content to display</p>
                <p className="text-slate-500 text-sm">
                  Generate or upload notes to see them here
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
