"use client";

import { motion } from "framer-motion";

interface TopicsGridProps {
  topics: Array<{ id: string; name: string; count: number }>;
  selectedTopic: string | null;
  onTopicSelect: (topicId: string | null) => void;
}

export function TopicsGrid({
  topics,
  selectedTopic,
  onTopicSelect,
}: TopicsGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-white">
          Topics
        </h3>
        {selectedTopic && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onTopicSelect(null)}
            className="inline-flex min-h-9 sm:min-h-10 w-fit items-center justify-center rounded-full bg-slate-700 px-2 sm:px-3 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Clear Filter
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
        {topics.map((topic, index) => {
          const isSelected = selectedTopic === topic.id;

          return (
            <motion.button
              key={topic.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${isSelected ? "Clear" : "Start"} ${topic.name} topic quiz`}
              onClick={() => onTopicSelect(isSelected ? null : topic.id)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative min-h-11 sm:min-h-12 overflow-hidden rounded-lg px-3 sm:px-4 py-2 sm:py-3 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 text-sm sm:text-base ${
                isSelected
                  ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/50"
                  : "bg-slate-800/50 text-slate-100 border border-slate-700 hover:border-violet-500/50"
              }`}
            >
              <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-3">
                <span className="min-w-0 break-words text-left">
                  {topic.name}
                </span>
                <span className="ml-2 shrink-0 rounded-full bg-slate-900/50 px-1.5 sm:px-2 py-0.5 text-xs">
                  {topic.count}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
