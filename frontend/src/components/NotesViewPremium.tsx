'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface CardProps {
    onClick?: () => void;
    className?: string;
    children: React.ReactNode;
}

interface ButtonProps {
    onClick?: (e: React.MouseEvent) => void;
    variant?: 'secondary' | 'primary';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    children: React.ReactNode;
}

function Card({ onClick, className, children }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={`rounded-lg ${className || ''}`}
        >
            {children}
        </div>
    );
}

function Button({ onClick, variant, size, className, children }: ButtonProps) {
    const baseClasses = 'px-4 py-2 rounded-lg transition-all';
    const variantClasses = variant === 'secondary' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-violet-600 hover:bg-violet-500';
    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variantClasses} ${className || ''}`}
        >
            {children}
        </button>
    );
}

interface NotesViewPremiumProps {
    content: string;
}

export function NotesViewPremium({ content }: NotesViewPremiumProps) {
    const [expandedSections, setExpandedSections] = useState<string[]>(['0']);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const sections = content
        .split(/(?=^## )/m)
        .filter(section => section.trim())
        .map((section, index) => ({
            id: index.toString(),
            title: section
                .split('\n')[0]
                .replace(/^## /, '')
                .trim(),
            content: section
                .split('\n')
                .slice(1)
                .join('\n')
                .trim(),
        }));

    const toggleSection = (id: string) => {
        setExpandedSections(prev =>
            prev.includes(id) ? prev.filter(sectionId => sectionId !== id) : [...prev, id]
        );
    };

    const copyToClipboard = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-12"
        >
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-600/10 to-cyan-600/5 rounded-full blur-3xl"
                    animate={{ y: [0, 40, 0], x: [0, 25, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tl from-cyan-600/10 to-violet-600/5 rounded-full blur-3xl"
                    animate={{ y: [0, -40, 0], x: [0, -25, 0] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                        Study Notes
                    </h1>
                    <p className="text-slate-400">
                        {sections.length} sections • {Math.ceil(content.length / 100)} minutes to read
                    </p>
                </motion.div>

                {/* Sections */}
                <div className="space-y-4">
                    {sections.map((section, index) => {
                        const isExpanded = expandedSections.includes(section.id);

                        return (
                            <motion.div
                                key={section.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card
                                    onClick={() => toggleSection(section.id)}
                                    className="cursor-pointer p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-violet-500/20 backdrop-blur-xl hover:border-violet-500/40 transition-all duration-300 group"
                                >
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                                            {section.title}
                                        </h2>
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronDown size={24} className="text-violet-400" />
                                        </motion.div>
                                    </div>

                                    {/* Expandable Content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="mt-6 pt-6 border-t border-slate-700/50"
                                            >
                                                {/* Copy Button */}
                                                <div className="flex justify-end mb-4">
                                                    <Button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            copyToClipboard(section.id, section.content);
                                                        }}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="text-xs"
                                                    >
                                                        {copiedId === section.id ? (
                                                            <>
                                                                <Check size={14} className="mr-1" /> Copied
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={14} className="mr-1" /> Copy
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                {/* Markdown Content */}
                                                <div className="prose prose-invert max-w-none prose-headings:text-violet-300 prose-p:text-slate-300 prose-strong:text-white prose-code:text-cyan-300 prose-code:bg-slate-800/50 prose-code:px-2 prose-code:py-1 prose-code:rounded">
                                                    <ReactMarkdown>
                                                        {section.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center text-slate-500 text-sm"
                >
                    <p>Click on any section to expand or collapse</p>
                </motion.div>
            </div>
        </motion.div>
    );
}
