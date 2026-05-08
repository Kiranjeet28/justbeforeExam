"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import {
  AlertTriangle,
  TrendingDown,
  BookOpen,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

export interface WeakTopic {
  topicName: string;
  correctCount: number;
  totalCount: number;
  suggestedActions: string[];
  difficulty?: "easy" | "medium" | "hard";
}

export interface WeakAreasAnalysisProps {
  topics: WeakTopic[];
  onStudyTopic?: (topicName: string) => void;
  onGetResources?: (topicName: string) => void;
  isLoading?: boolean;
}

const PercentageBar: React.FC<{
  percentage: number;
  showLabel?: boolean;
}> = ({ percentage, showLabel = true }) => {
  const getColor = () => {
    if (percentage >= 80) return "from-emerald-500 to-green-500";
    if (percentage >= 60) return "from-amber-400 to-orange-500";
    if (percentage >= 40) return "from-orange-500 to-red-500";
    return "from-red-500 to-rose-600";
  };

  return (
    <div className="space-y-2">
      <div className="relative w-full h-3 bg-slate-700/40 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className={`text-xs font-semibold ${
            percentage >= 80
              ? "text-emerald-400"
              : percentage >= 60
              ? "text-amber-400"
              : percentage >= 40
              ? "text-orange-400"
              : "text-red-400"
          }`}>
            {percentage.toFixed(0)}% Correct
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Needs Improvement
          </span>
        </div>
      )}
    </div>
  );
};

const TopicCard: React.FC<{
  topic: WeakTopic;
  index: number;
  onStudy?: () => void;
  onGetResources?: () => void;
}> = ({ topic, index, onStudy, onGetResources }) => {
  const percentage = Math.round((topic.correctCount / topic.totalCount) * 100);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getSeverityLabel = () => {
    if (percentage >= 80) return "Minimal Gap";
    if (percentage >= 60) return "Moderate Gap";
    if (percentage >= 40) return "Significant Gap";
    return "Critical Gap";
  };

  const getSeverityColor = () => {
    if (percentage >= 80) return "emerald";
    if (percentage >= 60) return "amber";
    if (percentage >= 40) return "orange";
    return "red";
  };

  const severity = getSeverityColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        variant="default"
        padding="md"
        className={`space-y-4 border-${severity}-500/30 bg-${severity}-500/5 cursor-pointer hover:bg-${severity}-500/10 transition-colors`}
        interactive
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-${severity}-500/30 text-${severity}-300 border border-${severity}-500/50`}
                >
                  {getSeverityLabel()}
                </div>
                {percentage >= 80 && (
                  <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                    Almost There! ✓
                  </div>
                )}
              </div>
              <h4 className="text-lg font-bold text-slate-100">
                {topic.topicName}
              </h4>
              <p className="text-sm text-slate-400 mt-1">
                {topic.correctCount} out of {topic.totalCount} questions correct
              </p>
            </div>

            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-shrink-0 text-slate-400"
            >
              <ChevronRight size={24} />
            </motion.div>
          </div>

          <PercentageBar percentage={percentage} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-t border-slate-700/50 pt-4 space-y-4"
            >
              {/* Action Items */}
              {topic.suggestedActions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className={`text-${severity}-400`} />
                    <p className="text-sm font-semibold text-slate-300">
                      Suggested Actions
                    </p>
                  </div>
                  <ul className="space-y-2">
                    <AnimatePresence>
                      {topic.suggestedActions.map((action, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start gap-2 text-sm text-slate-300"
                        >
                          <span className="text-blue-400 font-bold mt-0.5">
                            •
                          </span>
                          <span>{action}</span>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              )}

              {/* Stats Details */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/30 rounded-lg">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">
                    Correct
                  </p>
                  <p className="text-lg font-bold text-emerald-400">
                    {topic.correctCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">
                    Incorrect
                  </p>
                  <p className="text-lg font-bold text-red-400">
                    {topic.totalCount - topic.correctCount}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {onStudy && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStudy();
                    }}
                    icon={<BookOpen size={16} />}
                    className="flex-1"
                  >
                    Study Topic
                  </Button>
                )}
                {onGetResources && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGetResources();
                    }}
                    icon={<ChevronRight size={16} />}
                    className="flex-1"
                  >
                    Resources
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export const WeakAreasAnalysis: React.FC<WeakAreasAnalysisProps> = ({
  topics,
  onStudyTopic,
  onGetResources,
  isLoading = false,
}) => {
  const sortedTopics = [...topics].sort((a, b) => {
    const percentageA = (a.correctCount / a.totalCount) * 100;
    const percentageB = (b.correctCount / b.totalCount) * 100;
    return percentageA - percentageB;
  });

  const averagePercentage = Math.round(
    (sortedTopics.reduce((sum, t) => sum + (t.correctCount / t.totalCount) * 100, 0) / sortedTopics.length) * 10
  ) / 10;

  const criticalGaps = sortedTopics.filter(
    (t) => (t.correctCount / t.totalCount) * 100 < 60
  );

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <TrendingDown className="w-8 h-8 text-violet-400" />
        </motion.div>
        <p className="text-slate-300 font-medium">Analyzing weak areas...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-6"
    >
      {/* Summary Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card
          variant="elevated"
          gradient="violet-blue"
          padding="lg"
          className="space-y-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-100 mb-2">
                Weak Areas Analysis
              </h3>
              <p className="text-slate-400">
                Focus on these topics to improve your score
              </p>
            </div>
            <div className="p-3 bg-violet-500/20 rounded-lg">
              <TrendingDown className="w-6 h-6 text-violet-400" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium">
                Average Accuracy
              </p>
              <p className="text-2xl font-bold text-slate-100">
                {averagePercentage}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium">
                Topics to Review
              </p>
              <p className="text-2xl font-bold text-orange-400">
                {sortedTopics.length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium">
                Critical Gaps
              </p>
              <p className={`text-2xl font-bold ${criticalGaps.length > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {criticalGaps.length}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Critical Gaps Alert */}
      <AnimatePresence>
        {criticalGaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.15 }}
          >
            <Card
              variant="default"
              padding="md"
              className="border-red-500/30 bg-red-500/10 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg mt-1">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-300 mb-1">
                    Critical Knowledge Gaps Detected
                  </h4>
                  <p className="text-sm text-red-200/80">
                    The following {criticalGaps.length} topic(s) need immediate attention:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {criticalGaps.map((topic, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + idx * 0.05 }}
                        className="px-2.5 py-1 bg-red-500/30 text-red-300 rounded-full text-xs font-medium border border-red-500/50"
                      >
                        {topic.topicName}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topics List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-100">
            Topics by Performance
          </h3>
          <span className="text-sm text-slate-400 font-medium">
            {sortedTopics.length} topics
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {sortedTopics.map((topic, idx) => (
              <TopicCard
                key={topic.topicName}
                topic={topic}
                index={idx}
                onStudy={() => onStudyTopic?.(topic.topicName)}
                onGetResources={() => onGetResources?.(topic.topicName)}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Improvement Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="default" padding="md" className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h4 className="font-semibold text-slate-100">
              Study Recommendations
            </h4>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold mt-1">→</span>
              <span>
                Start with the topic with the lowest accuracy score
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold mt-1">→</span>
              <span>
                Review the explanations from this quiz for quick insights
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold mt-1">→</span>
              <span>
                Use the recommended resources to strengthen your knowledge
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold mt-1">→</span>
              <span>
                Retake the quiz after studying to track improvement
              </span>
            </li>
          </ul>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default WeakAreasAnalysis;
