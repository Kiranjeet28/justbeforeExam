"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ChevronRight, Check, AlertCircle, Loader } from "lucide-react";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  topic?: string;
}

export interface QuizViewProps {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  selectedAnswers: Record<string, string>;
  onAnswerSelect: (questionId: string, answer: string) => void;
  onNext: () => void;
  onPrevious?: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  error?: string | null;
  showExplanation?: boolean;
}

const ProgressIndicator: React.FC<{
  current: number;
  total: number;
}> = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-300">
          Question {current} of {total}
        </span>
        <span className="text-sm font-semibold text-violet-400">
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="relative w-full h-2 bg-slate-700/40 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
};

const OptionButton: React.FC<{
  option: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  showFeedback?: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({
  option,
  isSelected,
  isCorrect,
  isIncorrect,
  showFeedback,
  onClick,
  disabled,
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { y: -2, x: 2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`w-full px-5 py-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 text-left ${
        isSelected
          ? showFeedback
            ? isCorrect
              ? "bg-gradient-to-r from-emerald-500/30 to-green-500/30 border-2 border-emerald-400 text-emerald-100"
              : isIncorrect
              ? "bg-gradient-to-r from-red-500/30 to-rose-500/30 border-2 border-red-400 text-red-100"
              : "bg-gradient-to-r from-violet-500/40 to-blue-500/40 border-2 border-violet-400 text-slate-100"
            : "bg-gradient-to-r from-violet-500/40 to-blue-500/40 border-2 border-violet-400 text-slate-100"
          : "bg-slate-700/20 border-2 border-slate-600/40 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600/60 hover:text-slate-100"
      } ${disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer"}`}
    >
      <motion.div
        className="flex-shrink-0"
        animate={isSelected && showFeedback ? { scale: 1.2 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {isSelected && showFeedback ? (
          isCorrect ? (
            <Check className="w-5 h-5 text-emerald-400" />
          ) : isIncorrect ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : null
        ) : isSelected && !showFeedback ? (
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-violet-400 to-blue-400" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-slate-500/40" />
        )}
      </motion.div>
      <span className="flex-1">{option}</span>
    </motion.button>
  );
};

export const QuizView: React.FC<QuizViewProps> = ({
  questions,
  currentQuestionIndex,
  selectedAnswers,
  onAnswerSelect,
  onNext,
  onPrevious,
  onSubmit,
  isLoading = false,
  error = null,
  showExplanation = false,
}) => {
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestion?.id];
  const isAnswered = selectedAnswer !== undefined;

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
          <Loader className="w-8 h-8 text-violet-400" />
        </motion.div>
        <p className="text-slate-300 font-medium">Loading quiz...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 p-6"
      >
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-300 font-semibold">Error</h3>
            <p className="text-red-200/80 text-sm mt-1">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No questions available</p>
      </div>
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
      {/* Progress Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <ProgressIndicator
          current={currentQuestionIndex + 1}
          total={questions.length}
        />
      </motion.div>

      {/* Question Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card
          variant="elevated"
          gradient="violet-blue"
          className="space-y-6"
          padding="lg"
        >
          {/* Topic Badge */}
          {currentQuestion.topic && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block"
            >
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500/30 text-violet-300 border border-violet-500/50">
                {currentQuestion.topic}
              </span>
            </motion.div>
          )}

          {/* Question Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <p className="text-sm text-slate-400 font-medium">Question</p>
            <h3 className="text-xl font-bold text-slate-100 leading-relaxed">
              {currentQuestion.question}
            </h3>
          </motion.div>

          {/* Options */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <p className="text-sm text-slate-400 font-medium">Choose an answer</p>
            <div className="space-y-2">
              <AnimatePresence mode="wait">
                {currentQuestion.options.map((option, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.3 + idx * 0.05,
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                  >
                    <OptionButton
                      option={option}
                      isSelected={selectedAnswer === option}
                      isCorrect={
                        showExplanation &&
                        selectedAnswer === option &&
                        option === currentQuestion.correctAnswer
                      }
                      isIncorrect={
                        showExplanation &&
                        selectedAnswer === option &&
                        option !== currentQuestion.correctAnswer
                      }
                      showFeedback={showExplanation}
                      onClick={() => onAnswerSelect(currentQuestion.id, option)}
                      disabled={showExplanation}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="mt-4 pt-4 border-t border-slate-700/50"
              >
                <p className="text-sm text-slate-400 font-medium mb-2">Explanation</p>
                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/40">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex gap-3 justify-between pt-4"
      >
        <div className="flex gap-3">
          {!isFirstQuestion && onPrevious && (
            <Button
              variant="secondary"
              onClick={onPrevious}
              disabled={isLoading}
              className="flex-1 sm:flex-initial"
            >
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          {!isLastQuestion && (
            <Button
              variant="primary"
              onClick={onNext}
              disabled={!isAnswered || isLoading}
              icon={<ChevronRight size={18} />}
              iconPosition="right"
              className="flex-1 sm:flex-initial"
            >
              Next Question
            </Button>
          )}
          {isLastQuestion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="primary"
                onClick={() => setShowSubmitConfirm(true)}
                disabled={!isAnswered || isLoading}
                className="flex-1 sm:flex-initial"
              >
                Submit Quiz
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSubmitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-100 mb-2">
                Submit Quiz?
              </h3>
              <p className="text-slate-400 mb-6">
                You have answered all questions. Are you sure you want to submit?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    onSubmit();
                  }}
                  isLoading={isLoading}
                  className="flex-1"
                >
                  Submit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuizView;
