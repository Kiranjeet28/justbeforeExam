"use client";

import { useState } from "react";
import { Copy, Download, Printer, X } from "lucide-react";
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
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/reports`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: reportContent,
                        title: `Report - ${new Date().toLocaleDateString()}`,
                        source_ids: sourceCount.toString(),
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to save report");
            }

            alert("✓ Report saved to database successfully!");
        } catch (err) {
            console.error("Error saving report:", err);
            alert("Failed to save report to database. Please try again.");
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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header with Close Button */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                    <h2 className="text-xl font-bold text-blue-300">Exam Study Report</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors p-1"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-gray-400">Generating your report...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="p-6">
                            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
                                <p className="font-semibold mb-2">Error generating report</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    ) : reportContent ? (
                        <div className="p-6 report-content">
                            <ReactMarkdown
                                className="prose prose-invert max-w-none"
                                components={{
                                    h1: ({ children }: { children: ReactNode }) => (
                                        <h1 className="text-3xl font-bold text-blue-300 mt-6 mb-4">
                                            {children}
                                        </h1>
                                    ),
                                    h2: ({ children }: { children: ReactNode }) => (
                                        <h2 className="text-2xl font-bold text-cyan-300 mt-5 mb-3 print:text-black">
                                            {children}
                                        </h2>
                                    ),
                                    h3: ({ children }: { children: ReactNode }) => (
                                        <h3 className="text-lg font-semibold text-blue-200 mt-4 mb-2 print:text-gray-800">
                                            {children}
                                        </h3>
                                    ),
                                    p: ({ children }: { children: ReactNode }) => (
                                        <p className="text-gray-300 leading-relaxed mb-3 print:text-black">
                                            {children}
                                        </p>
                                    ),
                                    ul: ({ children }: { children: ReactNode }) => (
                                        <ul className="list-disc list-inside text-gray-300 mb-4 print:text-black">
                                            {children}
                                        </ul>
                                    ),
                                    ol: ({ children }: { children: ReactNode }) => (
                                        <ol className="list-decimal list-inside text-gray-300 mb-4 print:text-black">
                                            {children}
                                        </ol>
                                    ),
                                    li: ({ children }: { children: ReactNode }) => (
                                        <li className="text-gray-300 print:text-black">{children}</li>
                                    ),
                                    blockquote: ({ children }: { children: ReactNode }) => (
                                        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4 print:text-black print:border-gray-400">
                                            {children}
                                        </blockquote>
                                    ),
                                    code: ({ inline, children }: { inline?: boolean; children: ReactNode }) =>
                                        inline ? (
                                            <code className="bg-gray-800 text-cyan-300 px-2 py-1 rounded text-sm font-mono print:bg-gray-200 print:text-gray-800">
                                                {children}
                                            </code>
                                        ) : (
                                            <pre className="bg-gray-800 text-cyan-300 p-4 rounded font-mono text-sm overflow-x-auto my-4 print:bg-gray-100 print:text-gray-800">
                                                <code>{children}</code>
                                            </pre>
                                        ),
                                    strong: ({ children }: { children: ReactNode }) => (
                                        <strong className="text-blue-300 font-bold print:text-black">
                                            {children}
                                        </strong>
                                    ),
                                    em: ({ children }: { children: ReactNode }) => (
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
                    ) : null}
                </div>

                {/* Footer with Action Buttons */}
                {reportContent && !isLoading && !error && (
                    <div className="border-t border-gray-700 bg-gray-800 p-4 flex gap-3 justify-end print:hidden flex-wrap">
                        <button
                            onClick={handleCopyToClipboard}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${copied
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                }`}
                            title="Copy markdown to clipboard"
                        >
                            <Copy size={16} />
                            {copied ? "Copied!" : "Copy"}
                        </button>

                        <button
                            onClick={handleDownloadMarkdown}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
                            title="Download as Markdown file"
                        >
                            <Download size={16} />
                            Download MD
                        </button>

                        <button
                            onClick={handleSaveReport}
                            disabled={saving}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${saving
                                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                    : "bg-purple-600 text-white hover:bg-purple-700"
                                }`}
                            title="Save report to database"
                        >
                            {saving ? "Saving..." : "💾 Save to DB"}
                        </button>

                        <button
                            onClick={handlePrintToPDF}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
                            title="Print or save as PDF"
                        >
                            <Printer size={16} />
                            Print/PDF
                        </button>
                    </div>
                )}
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        background: white;
                        color: black;
                    }
                    
                    .fixed,
                    .print\\:hidden {
                        display: none !important;
                    }
                    
                    .report-content {
                        background: white;
                        color: black;
                        padding: 0;
                    }
                    
                    .report-content h2 {
                        page-break-after: avoid;
                        margin-top: 2rem;
                        margin-bottom: 1rem;
                    }
                    
                    .report-content h3 {
                        page-break-after: avoid;
                    }
                    
                    .report-content p,
                    .report-content ul,
                    .report-content ol {
                        orphans: 3;
                        widows: 3;
                        page-break-inside: avoid;
                    }
                    
                    .report-content li {
                        page-break-inside: avoid;
                    }
                    
                    .report-content a {
                        color: #0066cc;
                        text-decoration: underline;
                    }
                }
            `}</style>
        </div>
    );
}
