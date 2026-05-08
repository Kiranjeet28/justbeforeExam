'use client';

import { motion } from 'framer-motion';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

function Card({ className }: CardProps) {
    return <div className={`rounded-lg ${className || ''}`} />;
}

export function QuizScreenSkeleton() {
    return (
        <motion.div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-24 bg-gradient-to-r from-slate-800 to-slate-700 rounded-full animate-pulse" />
                    <div className="h-8 w-20 bg-slate-800/50 rounded-lg animate-pulse" />
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-600 to-cyan-600"
                        animate={{ width: ['0%', '45%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <Card className="p-8 bg-slate-800/30 border border-slate-700/50">
                <div className="space-y-6">
                    <div className="h-8 w-3/4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg animate-pulse" />

                    {/* Options */}
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="h-14 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
                <div className="h-12 w-24 bg-slate-800/50 rounded-lg animate-pulse" />
                <div className="h-12 flex-1 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg animate-pulse" />
            </div>
        </motion.div>
    );
}

export function NotesViewSkeleton() {
    return (
        <motion.div className="w-full max-w-4xl mx-auto space-y-4">
            {/* Header */}
            <div className="mb-8">
                <div className="h-10 w-48 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-64 bg-slate-800/50 rounded-lg animate-pulse" />
            </div>

            {/* Sections */}
            {[1, 2, 3].map(i => (
                <Card
                    key={i}
                    className="p-6 bg-slate-800/30 border border-slate-700/50"
                >
                    <div className="space-y-4">
                        <div className="h-6 w-2/3 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg animate-pulse" />
                        <div className="space-y-2">
                            {[1, 2, 3].map(j => (
                                <div
                                    key={j}
                                    className="h-4 w-full bg-slate-800/50 rounded animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                </Card>
            ))}
        </motion.div>
    );
}

export function ResultsScreenSkeleton() {
    return (
        <motion.div className="w-full max-w-2xl mx-auto space-y-8">
            {/* Score Circle */}
            <div className="flex flex-col items-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 animate-pulse mb-6" />
                <div className="h-8 w-32 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-48 bg-slate-800/50 rounded animate-pulse" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {[1, 2].map(i => (
                    <Card
                        key={i}
                        className="p-4 bg-slate-800/30 border border-slate-700/50"
                    >
                        <div className="h-4 w-20 bg-slate-800/50 rounded animate-pulse mb-2" />
                        <div className="h-6 w-16 bg-gradient-to-r from-slate-800 to-slate-700 rounded animate-pulse" />
                    </Card>
                ))}
            </div>

            {/* Areas Sections */}
            {[1, 2].map(i => (
                <div key={i} className="space-y-3">
                    <div className="h-5 w-32 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg animate-pulse" />
                    {[1, 2].map(j => (
                        <div
                            key={j}
                            className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
                        >
                            <div className="h-4 w-40 bg-slate-800/50 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            ))}

            {/* Buttons */}
            <div className="space-y-2">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className="h-12 w-full bg-slate-800/50 rounded-lg animate-pulse"
                    />
                ))}
            </div>
        </motion.div>
    );
}

export function InputSectionSkeleton() {
    return (
        <motion.div className="w-full max-w-2xl mx-auto space-y-4">
            <div className="h-10 w-32 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg animate-pulse mb-6" />
            <div className="h-12 w-full bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="h-12 w-full bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="h-12 w-32 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg animate-pulse" />
        </motion.div>
    );
}
