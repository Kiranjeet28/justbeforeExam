"use client";

import { useState } from "react";
import {
  Copy,
  Download,
  Printer,
  X,
  AlertCircle,
  Loader,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ReactNode } from "react";

interface ReportViewerProps {
  reportContent: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  sourceCount: number;
}

export default function ReportViewer({
  reportContent,
  isLoading,
  error,
  onClose,
  sourceCount,
}: ReportViewerProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopyToClipboard = async () => {
    if (!reportContent) return;

    try {
      await navigator.clipboard.writeText(reportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleSaveReport = async () => {
    if (!reportContent) return;

    setSaving(true);
    try {
      const key = "justbeforeexam-report-draft";
      const payload = {
        content: reportContent,
        title: `Report - ${new Date().toLocaleDateString()}`,
        source_ids: sourceCount.toString(),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
      console.log("[ReportViewer] saved draft locally:", payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving report:", err);
      alert("Could not save report locally. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrintToPDF = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    if (!reportContent) return;

    const blob = new Blob([reportContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-report-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!reportContent && !isLoading && !error) {
    return null;
  }

  // Loading State with Premium Spinner
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <style>{`
                    @keyframes fade-in {
                        from {
                            opacity: 0;
                            transform: scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    @keyframes pulse-ring {
                        0% {
                            transform: scale(1);
                            opacity: 1;
                        }
                        100% {
                            transform: scale(1.2);
                            opacity: 0;
                        }
                    }
                    .animate-fade-in {
                        animation: fade-in 0.3s ease-out;
                    }
                `}</style>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-3xl animate-pulse"></div>

          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-75 animate-pulse"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <Loader className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">
                  Generating your report
                </p>
                <p className="text-white/60 text-sm mt-1">
                  Analyzing your study materials...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State with Premium Styling
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <style>{`
                    @keyframes fade-in {
                        from {
                            opacity: 0;
                            transform: scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    .animate-fade-in {
                        animation: fade-in 0.3s ease-out;
                    }
                `}</style>
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl blur-3xl"></div>

          <div className="relative bg-white/10 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex gap-4 mb-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/20 border border-red-500/30">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-300 mb-1">
                  Error Generating Report
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">{error}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden animate-fade-in">
      <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .prose-custom h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #93c5fd;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                }
                .prose-custom h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #a5f3fc;
                    margin-top: 1.5rem;
                    margin-bottom: 1rem;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 0.5rem;
                }
                .prose-custom h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #bfdbfe;
                    margin-top: 1.25rem;
                    margin-bottom: 0.75rem;
                }
                .prose-custom p {
                    line-height: 1.75;
                    color: #e5e7eb;
                    margin-bottom: 1.25rem;
                }
                .prose-custom ul,
                .prose-custom ol {
                    margin: 1rem 0;
                    padding-left: 1.5rem;
                }
                .prose-custom li {
                    margin: 0.5rem 0;
                    color: #d1d5db;
                }
                .prose-custom code {
                    background: rgba(17, 24, 39, 0.6);
                    color: #67e8f9;
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                    font-family: 'Monaco', 'Courier New', monospace;
                    font-size: 0.9em;
                }
                .prose-custom pre {
                    background: rgba(17, 24, 39, 0.8);
                    color: #a5f3fc;
                    padding: 1rem;
                    border-radius: 8px;
                    overflow-x: auto;
                    margin: 1.5rem 0;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-left: 4px solid #0ea5e9;
                }
                .prose-custom pre code {
                    background: none;
                    color: inherit;
                    padding: 0;
                }
                .prose-custom blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1rem;
                    color: #9ca3af;
                    font-style: italic;
                    margin: 1.5rem 0;
                    background: rgba(59, 130, 246, 0.1);
                    padding: 1rem;
                    border-radius: 6px;
                }
                .prose-custom strong {
                    color: #93c5fd;
                    font-weight: 700;
                }
                .prose-custom em {
                    color: #a5f3fc;
                    font-style: italic;
                }
                .prose-custom hr {
                    border: none;
                    border-top: 2px solid rgba(255, 255, 255, 0.1);
                    margin: 2rem 0;
                }
                div::-webkit-scrollbar {
                    width: 8px;
                }
                div::-webkit-scrollbar-track {
                    background: transparent;
                }
                div::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                @media print {
                    body {
                        background: white;
                        color: black;
                    }
                    .fixed,
                    .print\:hidden {
                        display: none !important;
                    }
                    .report-content {
                        background: white;
                        color: black;
                        padding: 0;
                    }
                    .report-content h1 {
                        color: #0066cc;
                        font-size: 2rem;
                    }
                    .report-content h2 {
                        color: #0066cc;
                        font-size: 1.5rem;
                        border-bottom: 2px solid #0066cc;
                    }
                    .report-content h3 {
                        color: #0066cc;
                    }
                    .report-content p,
                    .report-content ul,
                    .report-content ol {
                        color: black;
                    }
                    .report-content code {
                        background: #f3f4f6;
                        color: black;
                    }
                    .report-content pre {
                        background: #f3f4f6;
                        color: black;
                        border-left-color: #0066cc;
                    }
                    .report-content blockquote {
                        background: #f9fafb;
                        color: #4b5563;
                        border-left-color: #0066cc;
                    }
                }
            `}</style>

      <div className="relative w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 rounded-3xl blur-3xl -z-10"></div>

        {/* Main glass morphism container */}
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full">
          {/* Header with gradient background */}
          <div className="relative flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-white/5 backdrop-blur-md">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Exam Study Report
              </h2>
              <p className="text-white/40 text-xs md:text-sm mt-1">
                Generated from {sourceCount} source
                {sourceCount !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200 hover:shadow-lg hover:shadow-white/10 flex-shrink-0"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            {/* Decorative gradient line */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />
          </div>

          {/* Content Area with better styling */}
          <div className="flex-1 overflow-y-auto">
            <div className="report-content prose-custom p-4 md:p-8">
              <ReactMarkdown
                components={{
                  h1: ({ children }: { children?: ReactNode }) => (
                    <h1 className="text-3xl font-bold text-blue-300 mt-6 mb-4 print:text-black print:color-blue-900">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }: { children?: ReactNode }) => (
                    <h2 className="text-2xl font-bold text-cyan-300 mt-5 mb-3 pb-2 border-b border-white/10 print:text-black print:border-gray-300">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }: { children?: ReactNode }) => (
                    <h3 className="text-lg font-semibold text-blue-200 mt-4 mb-2 print:text-gray-800">
                      {children}
                    </h3>
                  ),
                  p: ({ children }: { children?: ReactNode }) => (
                    <p className="text-gray-300 leading-relaxed mb-3 print:text-black">
                      {children}
                    </p>
                  ),
                  ul: ({ children }: { children?: ReactNode }) => (
                    <ul className="list-disc list-inside text-gray-300 mb-4 print:text-black space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }: { children?: ReactNode }) => (
                    <ol className="list-decimal list-inside text-gray-300 mb-4 print:text-black space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }: { children?: ReactNode }) => (
                    <li className="text-gray-300 print:text-black">
                      {children}
                    </li>
                  ),
                  blockquote: ({ children }: { children?: ReactNode }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4 bg-blue-500/10 p-4 rounded-r-lg print:text-black print:border-gray-400 print:bg-gray-100">
                      {children}
                    </blockquote>
                  ),
                  code: ({
                    inline,
                    children,
                  }: {
                    inline?: boolean;
                    children?: ReactNode;
                  }) =>
                    inline ? (
                      <code className="bg-gray-800/60 text-cyan-300 px-2 py-1 rounded text-sm font-mono print:bg-gray-200 print:text-gray-800">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-gray-800/60 text-cyan-300 p-4 rounded font-mono text-sm overflow-x-auto my-4 print:bg-gray-100 print:text-gray-800 border border-white/10 print:border-gray-300">
                        <code>{children}</code>
                      </pre>
                    ),
                  strong: ({ children }: { children?: ReactNode }) => (
                    <strong className="text-blue-300 font-bold print:text-black print:font-bold">
                      {children}
                    </strong>
                  ),
                  em: ({ children }: { children?: ReactNode }) => (
                    <em className="text-cyan-200 italic print:text-gray-600">
                      {children}
                    </em>
                  ),
                  hr: () => (
                    <hr className="my-6 border-gray-700 print:border-gray-300" />
                  ),
                }}
              >
                {reportContent}
              </ReactMarkdown>
            </div>
          </div>

          {/* Footer with Action Buttons */}
          <div className="border-t border-white/10 bg-white/5 backdrop-blur-md p-4 print:hidden">
            <div className="flex gap-2 md:gap-3 justify-end flex-wrap">
              <button
                onClick={handleCopyToClipboard}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm md:text-base font-medium transition-all duration-200 whitespace-nowrap ${
                  copied
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/10"
                }`}
                title="Copy markdown to clipboard"
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm md:text-base font-medium transition-all duration-200 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/10 whitespace-nowrap"
                title="Download as Markdown file"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Download</span>
              </button>

              <div className="w-px bg-white/10 hidden md:block"></div>

              <button
                onClick={handleSaveReport}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm md:text-base font-medium transition-all duration-200 whitespace-nowrap ${
                  saveSuccess
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                    : saving
                      ? "bg-white/10 text-white/60 cursor-not-allowed opacity-60 border border-white/20"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border border-purple-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20"
                }`}
                title="Save report locally in the browser"
              >
                {saveSuccess ? (
                  <>
                    <Check size={16} />
                    <span className="hidden sm:inline">Saved!</span>
                  </>
                ) : saving ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrintToPDF}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm md:text-base font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border border-blue-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 whitespace-nowrap"
                title="Print or save as PDF"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Print/PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
