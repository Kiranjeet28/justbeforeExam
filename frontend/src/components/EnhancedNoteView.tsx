"use client";

import { useState } from "react";
import { Download, FileText, GitGraph, BookMarked, Copy, X } from "lucide-react";
import { NotesView } from "./views";
import { <CheatSheetView></CheatSheetView> } from "./views";
import { MindMapView } from "./views/MindMapView";

export type ViewType = "notes" | "cheatsheet" | "mindmap";

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

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(noteData);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy to clipboard:", err);
        }
    };

    const handleExport = async (format: "pdf" | "markdown" | "png" | "svg") => {
        try {
            switch (format) {
                case "markdown":
                    exportAsMarkdown();
                    break;
                case "pdf":
                    exportAsPDF();
                    break;
                case "png":
                case "svg":
                    if (currentView === "mindmap") {
                        exportMindMapAsImage(format);
                    } else {
                        console.warn(`Export to ${format} not available for this view`);
                    }
                    break;
            }
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
        </html>`
            );
            printWindow.document.close();
        }
    };

    const exportMindMapAsImage = async (format: "png" | "svg") => {
        try {
            const element = document.getElementById("mindmap-container");
            if (!element) {
                console.warn("Mind map container not found");
                return;
            }

            if (format === "svg") {
                const svg = element.querySelector("svg");
                if (svg) {
                    const serializer = new XMLSerializer();
                    const svgString = serializer.serializeToString(svg);
                    const blob = new Blob([svgString], { type: "image/svg+xml" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `mindmap-${new Date().toISOString().split("T")[0]}.svg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            } else if (format === "png") {
                // Note: PNG export would require html2canvas or similar library
                console.log(
                    "PNG export requires additional setup with html2canvas library"
                );
                alert(
                    "PNG export is available with additional dependencies. Saving as SVG instead."
                );
                exportMindMapAsImage("svg");
            }
        } catch (err) {
            console.error("Failed to export mind map:", err);
        }
    };

    // Render appropriate view based on currentView state
    const renderView = () => {
        switch (currentView) {
            case "cheatsheet":
                return <CheatSheetView content={noteData} />;
            case "mindmap":
                return <MindMapView content={noteData} />;
            case "notes":
            default:
                return <NotesView content={noteData} />;
        }
    };

    // Determine available export formats based on current view
    const getExportFormats = (): Array<{ format: "pdf" | "markdown" | "png" | "svg"; label: string }> => {
        switch (currentView) {
            case "mindmap":
                return [
                    { format: "svg", label: "SVG" },
                    { format: "png", label: "PNG" },
                ];
            case "cheatsheet":
            case "notes":
            default:
                return [
                    { format: "markdown", label: "Markdown" },
                    { format: "pdf", label: "PDF" },
                ];
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin">⚙️</div>
                        <span className="text-gray-300">Processing your notes...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-red-500 rounded-lg p-6 max-w-md">
                    <h3 className="text-red-400 font-semibold mb-2">Error</h3>
                    <p className="text-gray-300 mb-4">{error}</p>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                    <h2 className="text-xl font-bold text-blue-300">{title}</h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-200 transition-colors p-1"
                            aria-label="Close"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* View Navigation Tabs */}
                <div className="flex gap-2 p-4 border-b border-gray-700 bg-gray-850 overflow-x-auto">
                    <button
                        onClick={() => setCurrentView("notes")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${currentView === "notes"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                    >
                        <FileText size={18} />
                        Notes
                    </button>

                    <button
                        onClick={() => setCurrentView("cheatsheet")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${currentView === "cheatsheet"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                    >
                        <BookMarked size={18} />
                        Cheat Sheet
                    </button>

                    <button
                        onClick={() => setCurrentView("mindmap")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${currentView === "mindmap"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                    >
                        <GitGraph size={18} />
                        Mind Map
                    </button>
                </div>

                {/* Toolbar with Actions */}
                <div className="flex flex-wrap gap-3 p-4 border-b border-gray-700 bg-gray-800 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleCopyToClipboard}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors text-sm"
                        >
                            <Copy size={16} />
                            {copied ? "Copied!" : "Copy"}
                        </button>

                        {getExportFormats().map((item) => (
                            <button
                                key={item.format}
                                onClick={() => handleExport(item.format)}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors text-sm"
                            >
                                <Download size={16} />
                                Export {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 text-gray-200">
                        {noteData ? (
                            renderView()
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p>No content to display</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
