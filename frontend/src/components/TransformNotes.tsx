"use client";

import { useState } from "react";
import { Wand2, Copy, Download, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface TransformArtifacts {
    cheat_sheet: string | null;
    mind_map: {
        root: string;
        children: Array<{
            branch: string;
            leafs: string[];
        }>;
    } | null;
}

interface TransformNotesProps {
    noteContent: string;
    onClose?: () => void;
    title?: string;
}

export function TransformNotes({ noteContent, onClose, title = "Transform Notes" }: TransformNotesProps) {
    const [isTransforming, setIsTransforming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [artifacts, setArtifacts] = useState<TransformArtifacts | null>(null);
    const [copied, setCopied] = useState<"cheat_sheet" | "mind_map" | null>(null);
    const [activeTab, setActiveTab] = useState<"cheat_sheet" | "mind_map">("cheat_sheet");

    const handleTransform = async () => {
        setIsTransforming(true);
        setError(null);

        try {
            const response = await fetch("/api/transform-notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: noteContent }),
            });

            if (response.status === 429) {
                setError("Service is rate limited. Please try again in a moment.");
                return;
            }

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    setError(errorData.detail?.message || `Error: ${response.statusText}`);
                } catch {
                    // If response body is not JSON (e.g., HTML error page)
                    setError(`Error: ${response.status} ${response.statusText}`);
                }
                return;
            }

            const data = await response.json();
            if (data.success) {
                setArtifacts(data.artifacts);
            } else {
                setError("Failed to transform notes");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to transform notes");
        } finally {
            setIsTransforming(false);
        }
    };

    const handleCopy = (text: string | object, type: "cheat_sheet" | "mind_map") => {
        navigator.clipboard.writeText(
            type === "mind_map" ? JSON.stringify(text, null, 2) : text as string
        );
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleDownload = (text: string | object, type: "cheat_sheet" | "mind_map") => {
        const content = type === "mind_map" ? JSON.stringify(text, null, 2) : text as string;
        const filename = type === "cheat_sheet" ? "cheat-sheet.md" : "mind-map.json";
        const blob = new Blob([content], { type: type === "cheat_sheet" ? "text/markdown" : "application/json" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!artifacts) {
        return (
            <div className="flex flex-col items-center gap-4 p-6">
                <Wand2 size={32} className="text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
                <p className="text-center text-sm text-gray-400">
                    Transform your study notes into specialized formats:
                    <br /> Cheat Sheet + Mind Map
                </p>
                {error && (
                    <div className="w-full rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    </div>
                )}
                <button
                    onClick={handleTransform}
                    disabled={isTransforming}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition ${isTransforming
                        ? "cursor-not-allowed bg-gray-700 text-gray-500"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                        }`}
                >
                    {isTransforming ? "Transforming..." : "Transform Notes"}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-700">
                <button
                    onClick={() => setActiveTab("cheat_sheet")}
                    disabled={!artifacts.cheat_sheet}
                    className={`px-4 py-2 font-semibold transition ${activeTab === "cheat_sheet"
                        ? "border-b-2 border-purple-400 text-purple-300"
                        : "text-gray-400 hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                        }`}
                >
                    Cheat Sheet
                </button>
                <button
                    onClick={() => setActiveTab("mind_map")}
                    disabled={!artifacts.mind_map}
                    className={`px-4 py-2 font-semibold transition ${activeTab === "mind_map"
                        ? "border-b-2 border-purple-400 text-purple-300"
                        : "text-gray-400 hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                        }`}
                >
                    Mind Map
                </button>
            </div>

            {/* Content Area */}
            <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800/30 p-4">
                {activeTab === "cheat_sheet" && artifacts.cheat_sheet ? (
                    <div className="prose prose-invert max-w-none">
                        <ReactMarkdown
                            components={{
                                h2: ({ ...props }) => <h2 className="mt-4 mb-2 text-lg font-bold text-purple-300" {...props} />,
                                h3: ({ ...props }) => <h3 className="mt-3 mb-1 text-base font-semibold text-purple-200" {...props} />,
                                p: ({ ...props }) => <p className="mb-2 text-gray-300" {...props} />,
                                ul: ({ ...props }) => <ul className="mb-2 list-inside list-disc space-y-1 text-gray-300" {...props} />,
                                li: ({ ...props }) => <li className="text-sm text-gray-300" {...props} />,
                                code: ({ ...props }) => (
                                    <code className="rounded bg-gray-900 px-1 py-0.5 font-mono text-sm text-purple-200" {...props} />
                                ),
                            }}
                        >
                            {artifacts.cheat_sheet}
                        </ReactMarkdown>
                    </div>
                ) : activeTab === "mind_map" && artifacts.mind_map ? (
                    <div className="text-sm text-gray-300">
                        <div className="mb-4 p-3 rounded-lg bg-purple-900/20 border border-purple-500/30">
                            <p className="font-semibold text-purple-300">{artifacts.mind_map.root}</p>
                        </div>
                        {artifacts.mind_map.children && artifacts.mind_map.children.length > 0 && (
                            <div className="space-y-3">
                                {artifacts.mind_map.children.map((child, idx) => (
                                    <div key={idx} className="border-l-2 border-purple-500/50 pl-3">
                                        <p className="font-semibold text-purple-300">{child.branch}</p>
                                        <ul className="mt-1 list-inside list-disc space-y-0.5">
                                            {child.leafs && child.leafs.map((leaf, leafIdx) => (
                                                <li key={leafIdx} className="text-xs text-gray-400">{leaf}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 rounded-lg border border-gray-700 bg-gray-900 p-3">
                            <p className="text-xs font-mono text-gray-400">
                                {JSON.stringify(artifacts.mind_map, null, 2).slice(0, 200)}...
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-400">No content available</p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => {
                        const content =
                            activeTab === "cheat_sheet"
                                ? artifacts.cheat_sheet
                                : artifacts.mind_map;
                        if (content) {
                            handleCopy(content, activeTab);
                        }
                    }}
                    className="flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600 transition"
                >
                    <Copy size={16} />
                    {copied === activeTab ? "Copied!" : "Copy"}
                </button>
                <button
                    onClick={() => {
                        const content =
                            activeTab === "cheat_sheet"
                                ? artifacts.cheat_sheet
                                : artifacts.mind_map;
                        if (content) {
                            handleDownload(content, activeTab);
                        }
                    }}
                    className="flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600 transition"
                >
                    <Download size={16} />
                    Download
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-auto rounded-lg bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600 transition"
                    >
                        Close
                    </button>
                )}
            </div>

            {/* Transform Again Button */}
            <button
                onClick={handleTransform}
                disabled={isTransforming}
                className={`w-full rounded-lg px-4 py-2 font-semibold transition ${isTransforming
                    ? "cursor-not-allowed bg-gray-700 text-gray-500"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
            >
                {isTransforming ? "Transforming..." : "Transform Again"}
            </button>
        </div>
    );
}
