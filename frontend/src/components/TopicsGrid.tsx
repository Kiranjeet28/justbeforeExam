'use client';

import { motion } from 'framer-motion';

interface TopicsGridProps {
    topics: Array<{ id: string; name: string; count: number }>;
    selectedTopic: string | null;
    onTopicSelect: (topicId: string | null) => void;
}

export function TopicsGrid({ topics, selectedTopic, onTopicSelect }: TopicsGridProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Topics</h3>
                {selectedTopic && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => onTopicSelect(null)}
                        className="text-xs px-3 py-1 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    >
                        Clear Filter
                    </motion.button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {topics.map((topic, index) => {
                    const isSelected = selectedTopic === topic.id;

                    return (
                        <motion.button
                            key={topic.id}
                            onClick={() => onTopicSelect(isSelected ? null : topic.id)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative px-4 py-3 rounded-lg font-medium transition-all duration-300 overflow-hidden group ${isSelected
                                    ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/50'
                                    : 'bg-slate-800/50 text-slate-100 border border-slate-700 hover:border-violet-500/50'
                                }`}
                        >
                            {/* Glowing Border for Selected */}
                            {isSelected && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-violet-400/30 to-cyan-400/30 rounded-lg blur"
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    style={{ pointerEvents: 'none' }}
                                />
                            )}

                            <div className="relative z-10 flex items-center justify-between">
                                <span>{topic.name}</span>
                                <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-slate-900/50">
                                    {topic.count}
                                </span>
                            </div>

                            {/* Hover Shimmer */}
                            {!isSelected && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                    initial={{ x: '-100%' }}
                                    whileHover={{ x: '100%' }}
                                    transition={{ duration: 0.6 }}
                                    style={{ pointerEvents: 'none' }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}
