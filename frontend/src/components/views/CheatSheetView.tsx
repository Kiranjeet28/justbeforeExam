"use client";

import ReactMarkdown from "react-markdown";

interface CheatSheetViewProps {
    content: string;
}

export function CheatSheetView({ content }: CheatSheetViewProps) {
    // Transform content to be more cheat-sheet-like
    const processedContent = transformToCheatSheet(content);

    return (
        <div className="prose prose-invert max-w-none">
            <ReactMarkdown
                className="text-gray-200 leading-relaxed"
                components={{
                    h1: ({ ...props }) => (
                        <h1 className="text-3xl font-bold text-green-400 mt-6 mb-4 border-b-2 border-green-500 pb-2" {...props} />
                    ),
                    h2: ({ ...props }) => (
                        <h2 className="text-2xl font-bold text-green-300 mt-5 mb-3 border-l-4 border-green-500 pl-3" {...props} />
                    ),
                    h3: ({ ...props }) => (
                        <h3 className="text-lg font-bold text-green-200 mt-4 mb-2 bg-gray-800 p-2 rounded" {...props} />
                    ),
                    p: ({ ...props }) => (
                        <p className="mb-3 text-gray-300 font-medium" {...props} />
                    ),
                    ul: ({ ...props }) => (
                        <ul className="list-disc list-inside mb-3 text-gray-300 space-y-1" {...props} />
                    ),
                    ol: ({ ...props }) => (
                        <ol className="list-decimal list-inside mb-3 text-gray-300 space-y-1" {...props} />
                    ),
                    li: ({ ...props }) => (
                        <li className="ml-2 text-sm" {...props} />
                    ),
                    blockquote: ({ ...props }) => (
                        <blockquote
                            className="border-l-4 border-green-500 pl-4 py-2 my-3 bg-green-900/20 text-green-200 font-semibold rounded"
                            {...props}
                        />
                    ),
                    code: (props) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { inline, children } = props as any;
                        return inline ? (
                            <code
                                className="bg-gray-800 px-2 py-1 rounded text-yellow-300 font-mono text-sm border border-gray-700"
                            >
                                {children}
                            </code>
                        ) : (
                            <code className="block bg-gray-800 p-3 rounded mb-3 overflow-x-auto text-yellow-300 font-mono text-xs border border-gray-700">
                                {children}
                            </code>
                        );
                    },
                    pre: ({ ...props }) => (
                        <pre className="bg-gray-800 p-3 rounded-lg mb-3 overflow-x-auto border border-gray-700" {...props} />
                    ),
                    table: ({ ...props }) => (
                        <table
                            className="border-collapse border border-gray-600 w-full my-3 text-sm"
                            {...props}
                        />
                    ),
                    th: ({ ...props }) => (
                        <th className="border border-gray-600 px-3 py-2 bg-green-900/40 text-green-300 font-bold" {...props} />
                    ),
                    td: ({ ...props }) => (
                        <td className="border border-gray-600 px-3 py-2 text-gray-300" {...props} />
                    ),
                    a: ({ ...props }) => (
                        <a className="text-green-400 hover:text-green-300 underline font-semibold" {...props} />
                    ),
                    img: (props) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { alt, src } = props as any;
                        // eslint-disable-next-line @next/next/no-img-element
                        return <img className="max-w-full h-auto rounded-lg my-3" alt={alt || "content"} src={src} />;
                    },
                    hr: ({ ...props }) => (
                        <hr className="border-green-500/30 my-4" {...props} />
                    ),
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
}

/**
 * Transform content to be more suitable for a cheat sheet format
 * - Makes sections more compact
 * - Emphasizes key points
 * - Improves readability for quick reference
 */
function transformToCheatSheet(content: string): string {
    let processed = content;

    // Ensure multiple newlines are reduced for compactness
    processed = processed.replace(/\n{3,}/g, "\n\n");

    // Highlight key terms (wrapped in asterisks)
    processed = processed.replace(/\*\*([^*]+)\*\*/g, "**$1**");

    // Convert common patterns to more cheat-sheet friendly format
    // Example: "Key Concept: description" -> "### Key Concept\ndescription"
    processed = processed.replace(/^([^:\n]+):\s+/gm, "### $1\n");

    return processed;
}
