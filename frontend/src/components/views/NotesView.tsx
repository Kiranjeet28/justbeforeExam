"use client";

import ReactMarkdown from "react-markdown";

interface NotesViewProps {
    content: string;
}

export function NotesView({ content }: NotesViewProps) {
    return (
        <div className="prose prose-invert max-w-none">
            <ReactMarkdown
                className="text-gray-200 leading-relaxed"
                components={{
                    h1: ({ ...props }) => (
                        <h1 className="text-3xl font-bold text-blue-400 mt-6 mb-4" {...props} />
                    ),
                    h2: ({ ...props }) => (
                        <h2 className="text-2xl font-bold text-blue-300 mt-5 mb-3" {...props} />
                    ),
                    h3: ({ ...props }) => (
                        <h3 className="text-xl font-bold text-blue-200 mt-4 mb-2" {...props} />
                    ),
                    p: ({ ...props }) => (
                        <p className="mb-4 text-gray-300" {...props} />
                    ),
                    ul: ({ ...props }) => (
                        <ul className="list-disc list-inside mb-4 text-gray-300 space-y-2" {...props} />
                    ),
                    ol: ({ ...props }) => (
                        <ol className="list-decimal list-inside mb-4 text-gray-300 space-y-2" {...props} />
                    ),
                    li: ({ ...props }) => (
                        <li className="ml-2" {...props} />
                    ),
                    blockquote: ({ ...props }) => (
                        <blockquote
                            className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-gray-800 italic text-gray-400"
                            {...props}
                        />
                    ),
                    code: (props) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { inline, children } = props as any;
                        return inline ? (
                            <code
                                className="bg-gray-800 px-2 py-1 rounded text-orange-300 font-mono text-sm"
                            >
                                {children}
                            </code>
                        ) : (
                            <code className="block bg-gray-800 p-4 rounded mb-4 overflow-x-auto text-orange-300 font-mono text-sm">
                                {children}
                            </code>
                        );
                    },
                    pre: ({ ...props }) => (
                        <pre className="bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto" {...props} />
                    ),
                    table: ({ ...props }) => (
                        <table
                            className="border-collapse border border-gray-600 w-full my-4"
                            {...props}
                        />
                    ),
                    th: ({ ...props }) => (
                        <th className="border border-gray-600 px-4 py-2 bg-gray-800 text-blue-300" {...props} />
                    ),
                    td: ({ ...props }) => (
                        <td className="border border-gray-600 px-4 py-2 text-gray-300" {...props} />
                    ),
                    a: ({ ...props }) => (
                        <a className="text-blue-400 hover:text-blue-300 underline" {...props} />
                    ),
                    img: (props) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { alt, src } = props as any;
                        // eslint-disable-next-line @next/next/no-img-element
                        return <img className="max-w-full h-auto rounded-lg my-4" alt={alt || "content"} src={src} />;
                    },
                    hr: ({ ...props }) => (
                        <hr className="border-gray-600 my-6" {...props} />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
