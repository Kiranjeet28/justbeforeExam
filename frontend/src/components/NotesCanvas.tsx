"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { X, Edit2, Save, FileDown, Check } from "lucide-react";

interface Citation {
    id: number;
    type: string;
    preview: string;
}

interface NotesCanvasProps {
    isOpen: boolean;
    onClose: () => void;
    initialNotes: string;
    citations?: Citation[];
    onSave: (title: string, content: string) => Promise<void>;
}

export function NotesCanvas({
    isOpen,
    onClose,
    initialNotes,
    citations = [],
    onSave,
}: NotesCanvasProps) {
    const [content, setContent] = useState(initialNotes);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("Study Notes");
    const [localSaving, setLocalSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLocalSaving(true);
        try {
            await onSave(title, content);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save notes:", err);
        } finally {
            setLocalSaving(false);
        }
    };

    const downloadNotes = () => {
        const element = document.createElement("a");
        const file = new Blob([content], { type: "text/markdown" });
        element.href = URL.createObjectURL(file);
        element.download = `${title.replace(/\s+/g, "-").toLowerCase()}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative flex h-[90vh] w-[95vw] max-w-6xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-700 p-6">
                            <div className="flex-1">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-slate-800 px-3 py-2 text-2xl font-bold text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-400 rounded-lg"
                                        placeholder="Study Notes Title"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                                aria-label="Close"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden">
                            {isEditing ? (
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="h-full w-full resize-none bg-slate-950 p-6 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-400"
                                    placeholder="Edit your study notes here..."
                                />
                            ) : (
                                <div className="h-full overflow-y-auto p-6">
                                    <div className="prose prose-invert max-w-none">
                                        <ReactMarkdown
                                            components={{
                                                h2: ({ ...props }) => (
                                                    <h2
                                                        className="mt-6 mb-3 text-2xl font-bold text-cyan-300"
                                                        {...props}
                                                    />
                                                ),
                                                h3: ({ ...props }) => (
                                                    <h3
                                                        className="mt-4 mb-2 text-xl font-bold text-slate-100"
                                                        {...props}
                                                    />
                                                ),
                                                p: ({ ...props }) => (
                                                    <p className="mb-3 text-slate-200" {...props} />
                                                ),
                                                ul: ({ ...props }) => (
                                                    <ul
                                                        className="mb-3 list-inside list-disc space-y-1 text-slate-200"
                                                        {...props}
                                                    />
                                                ),
                                                ol: ({ ...props }) => (
                                                    <ol
                                                        className="mb-3 list-inside list-decimal space-y-1 text-slate-200"
                                                        {...props}
                                                    />
                                                ),
                                                li: ({ ...props }) => (
                                                    <li className="text-slate-200" {...props} />
                                                ),
                                                strong: ({ ...props }) => (
                                                    <strong className="font-bold text-emerald-300" {...props} />
                                                ),
                                                em: ({ ...props }) => (
                                                    <em className="italic text-cyan-200" {...props} />
                                                ),
                                                code: ({ ...props }) => (
                                                    <code
                                                        className="rounded bg-slate-800 px-2 py-1 font-mono text-sm text-rose-300"
                                                        {...props}
                                                    />
                                                ),
                                            }}
                                        >
                                            {content}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Source Citations */}
                                    {citations.length > 0 && (
                                        <div className="mt-8 border-t border-slate-700 pt-6">
                                            <h3 className="text-lg font-semibold text-cyan-300 mb-3">
                                                📚 Source Citations
                                            </h3>
                                            <div className="space-y-2">
                                                {citations.map((citation, idx) => (
                                                    <div
                                                        key={citation.id}
                                                        className="rounded-lg bg-slate-800/50 border border-slate-700 p-3 text-sm"
                                                    >
                                                        <p className="font-semibold text-slate-200">
                                                            [{idx + 1}] {citation.type.toUpperCase()} (ID:{" "}
                                                            {citation.id})
                                                        </p>
                                                        <p className="text-slate-400 text-xs mt-1">
                                                            {citation.preview}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between border-t border-slate-700 bg-slate-800/50 p-4">
                            <button
                                onClick={downloadNotes}
                                className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-slate-100"
                            >
                                <FileDown size={18} />
                                Download
                            </button>

                            <div className="flex gap-3">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setContent(initialNotes);
                                                setIsEditing(false);
                                            }}
                                            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
                                        >
                                            Cancel
                                        </button>
                                        <motion.button
                                            onClick={handleSave}
                                            disabled={localSaving || !content.trim()}
                                            className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {saveSuccess ? (
                                                <>
                                                    <Check size={18} />
                                                    Saved!
                                                </>
                                            ) : localSaving ? (
                                                "Saving..."
                                            ) : (
                                                <>
                                                    <Save size={18} />
                                                    Save to Workspace
                                                </>
                                            )}
                                        </motion.button>
                                    </>
                                ) : (
                                    <motion.button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Edit2 size={18} />
                                        Edit Notes
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}