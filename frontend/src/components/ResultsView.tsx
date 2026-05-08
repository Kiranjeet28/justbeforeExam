"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import {
  RotateCcw,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
} from "lucide-react";

export interface QuestionResult {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  topic?: string;
}

export interface ResultsViewProps {
  score: number;
  totalQuestions: number;
  results: QuestionResult[];
  timestamp?: Date;
  onRetakeQuiz: () => void;
  onViewWeakAreas: () => void;
  isLoading?: boolean;
}

const CircularProgress: React.FC<{
  percentage: number;
  score: number;
  total: number;
}> = ({ percentage, score, total }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-700/30"
          />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                stopColor={
                  percentage >= 80
                    ? "#10b981"
                    : percentage >= 60
                    ? "#f59e0b"
                    : "#ef4444"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  percentage >= 80
                    ? "#059669"
                    : percentage >= 60
                    ? "#d97706"
                    : "#dc2626"
                }
              />
            </linearGradient>
          </defs>
        </svg>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <p className="text-4xl font-bold text-slate-100">{percentage}%</p>
          <p className="text-sm text-slate-400 mt-1">Score</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center space-y-2"
      >
        <p className="text-2xl font-bold text-slate-100">
          {score} / {total}
        </p>
        <p className="text-slate-400 text-sm">
          {score === total
            ? "Perfect Score! 🎉"
            : score >= total * 0.8
            ? "Excellent Performance!"
            : score >= total * 0.6
            ? "Good Job!"
            : "Keep Practicing!"}
        </p>
      </motion.div>
    </div>
  );
};

const AnswerComparison: React.FC<{ result: QuestionResult }> = ({ result }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-slate-700/30 overflow-hidden bg-slate-800/30"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-4 hover:bg-slate-800/50 transition-colors group"
      >
        <div className="flex-shrink-0 mt-1">
          {result.isCorrect ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="p-1.5 rounded-full bg-emerald-500/20"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="p-1.5 rounded-full bg-red-500/20"
            >
              <XCircle className="w-5 h-5 text-red-400" />
            </motion.div>
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          {result.topic && (
            <p className="text-xs text-slate-400 font-medium mb-1">
              {result.topic}
            </p>
          )}
          <p className="text-slate-200 font-medium line-clamp-2">
            {result.question}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {result.isCorrect ? (
              <span className="text-emerald-400">✓ Correct Answer</span>
            ) : (
              <span className="text-red-400">✗ Incorrect Answer</span>
            )}
          </p>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-shrink-0 text-slate-400 group-hover:text-slate-300"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-t border-slate-700/30 px-4 py-4 bg-slate-800/50 space-y-3"
          >
            {!result.isCorrect && (
              <div className="space-y-2">
                <div className="text-sm">
                  <p className="text-slate-400 font-medium mb-1">Your Answer:</p>
                  <p className="px-3 py-2 rounded bg-red-500/10 border border-red-500/30 text-red-200">
                    {result.userAnswer}
                  </p>
                </div>

                <div className="text-sm">
                  <p className="text-slate-400 font-medium mb-1">Correct Answer:</p>
                  <p className="px-3 py-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
                    {result.correctAnswer}
                  </p>
                </div>
              </div>
            )}

            {result.explanation && (
              <div className="text-sm space-y-2 pt-2 border-t border-slate-700/30">
                <p className="text-slate-400 font-medium">Explanation:</p>
                <p className="text-slate-300 leading-relaxed">
                  {result.explanation}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const ResultsView: React.FC<ResultsViewProps> = ({
  score,
  totalQuestions,
  results,
  timestamp,
  onRetakeQuiz,
  onViewWeakAreas,
  isLoading = false,
}) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  const correctCount = results.filter((r) => r.isCorrect).length;
  const incorrectCount = results.filter((r) => !r.isCorrect).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-8"
    >
      {/* Score Display Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card
          variant="elevated"
          gradient="violet-blue"
          padding="lg"
          className="flex flex-col items-center py-8"
        >
          <CircularProgress
            percentage={percentage}
            score={score}
            total={totalQuestions}
          />
        </Card>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Correct Answers */}
        <Card
          variant="default"
          padding="md"
          className="space-y-3 border-emerald-500/30 bg-emerald-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 font-semibold text-lg">
                {correctCount}
              </p>
              <p className="text-emerald-300/70 text-xs font-medium">
                Correct
              </p>
            </div>
          </div>
        </Card>

        {/* Incorrect Answers */}
        <Card
          variant="default"
          padding="md"
          className="space-y-3 border-red-500/30 bg-red-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-500/20">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-red-400 font-semibold text-lg">
                {incorrectCount}
              </p>
              <p className="text-red-300/70 text-xs font-medium">Incorrect</p>
            </div>
          </div>
        </Card>

        {/* Timestamp */}
        {timestamp && (
          <Card
            variant="default"
            padding="md"
            className="space-y-3 border-slate-600/30"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-600/20">
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-slate-300 font-semibold text-sm">
                  {timestamp.toLocaleDateString()}
                </p>
                <p className="text-slate-400 text-xs font-medium">
                  {timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Question Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-100">
            Question Breakdown
          </h3>
          <p className="text-sm text-slate-400">
            {results.length} of {results.length}
          </p>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          <AnimatePresence>
            {results.map((result, idx) => (
              <motion.div
                key={result.questionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + idx * 0.05 }}
              >
                <AnswerComparison result={result} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 pt-4"
      >
        <Button
          variant="secondary"
          onClick={onViewWeakAreas}
          disabled={isLoading}
          icon={<TrendingUp size={18} />}
          fullWidth
          className="sm:flex-1"
        >
          View Weak Areas
        </Button>
        <Button
          variant="primary"
          onClick={onRetakeQuiz}
          disabled={isLoading}
          isLoading={isLoading}
          icon={<RotateCcw size={18} />}
          fullWidth
          className="sm:flex-1"
        >
          Retake Quiz
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default ResultsView;
