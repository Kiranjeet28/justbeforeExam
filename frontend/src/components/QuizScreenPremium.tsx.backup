'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import type React from 'react';

interface ButtonProps {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    children: React.ReactNode;
}

function Button({ onClick, variant, disabled, className, type = 'button', children }: ButtonProps) {
    const baseClasses = 'inline-flex min-h-11 items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
    const variantClasses = variant === 'secondary'
        ? 'bg-slate-700 hover:bg-slate-600 text-white'
        : 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses} ${className || ''}`}
        >
            {children}
        </button>
    );
}

interface CardProps {
    className?: string;
    children: React.ReactNode;
}

function Card({ className, children }: CardProps) {
    return (
        <section className={`rounded-lg ${className || ''}`}>
            {children}
        </section>
    );
}

interface MCQQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    topic?: string;
}

interface QuizScreenPremiumProps {
    questions: MCQQuestion[];
    onAnswerSelected: (questionId: string, answerIndex: number) => void;
    onSubmit: () => void;
    answers: Record<string, number | null>;
    isLoading?: boolean;
    timeLimit?: number;
    onTimeUp?: () => void;
}

export function QuizScreenPremium({
    questions,
    onAnswerSelected,
    onSubmit,
    answers,
    isLoading = false,
    timeLimit,
    onTimeUp,
}: QuizScreenPremiumProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(timeLimit || null);

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const hasAnsweredAny = questions.some(question => answers[question.id] !== null && answers[question.id] !== undefined);

    useEffect(() => {
        if (!timeLimit) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 0) {
                    return 0;
                }
                if (prev <= 1) {
                    onTimeUp?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLimit, onTimeUp]);

    const handleAnswerClick = (optionIndex: number) => {
        onAnswerSelected(currentQuestion.id, optionIndex);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isTimeRunningOut = timeLeft !== null && timeLeft < 60;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
                return;
            }

            if (event.altKey || event.ctrlKey || event.metaKey) {
                return;
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                if (currentIndex < questions.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                }
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                if (currentIndex > 0) {
                    setCurrentIndex(currentIndex - 1);
                }
            }

            if (/^[1-9]$/.test(event.key)) {
                const optionIndex = Number(event.key) - 1;
                if (optionIndex < currentQuestion.options.length) {
                    event.preventDefault();
                    onAnswerSelected(currentQuestion.id, optionIndex);
                }
            }

            if (event.key === 'Enter' && currentIndex === questions.length - 1 && hasAnsweredAny && !isLoading) {
                event.preventDefault();
                onSubmit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, currentQuestion.id, currentQuestion.options.length, hasAnsweredAny, isLoading, onAnswerSelected, onSubmit, questions.length]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 sm:px-6 md:p-12"
        >
            <div className="relative z-10 max-w-2xl mx-auto">
                {/* Header with Progress & Timer */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-violet-400">
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            {currentQuestion.topic && (
                                <span className="max-w-full break-words text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">
                                    {currentQuestion.topic}
                                </span>
                            )}
                        </div>
                        {/* Progress Bar */}
                        <div
                            className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(progress)}
                            aria-label="Quiz progress"
                        >
                            <motion.div
                                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                        </div>
                    </div>

                    {/* Timer */}
                    {timeLeft !== null && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`flex w-fit items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-xl border ${isTimeRunningOut
                                ? 'border-red-500/50 bg-red-500/10'
                                : 'border-cyan-500/30 bg-cyan-500/10'
                                }`}
                            role="timer"
                            aria-live={isTimeRunningOut ? 'assertive' : 'polite'}
                        >
                            <Clock size={18} className={isTimeRunningOut ? 'text-red-400' : 'text-cyan-400'} />
                            <span
                                className={`font-mono font-semibold ${isTimeRunningOut ? 'text-red-300' : 'text-cyan-300'
                                    }`}
                            >
                                {formatTime(timeLeft)}
                            </span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="mb-8"
                    >
                        <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-violet-500/20 backdrop-blur-xl">
                            <h2 id="quiz-question-title" className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 leading-relaxed break-words">
                                {currentQuestion.question}
                            </h2>

                            {/* Options */}
                            <div className="space-y-3" role="radiogroup" aria-labelledby="quiz-question-title">
                                {currentQuestion.options.map((option, index) => {
                                    const isSelected = answers[currentQuestion.id] === index;

                                    return (
                                        <motion.button
                                            key={index}
                                            type="button"
                                            role="radio"
                                            aria-checked={isSelected}
                                            aria-label={`Option ${String.fromCharCode(65 + index)}: ${option}`}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => handleAnswerClick(index)}
                                            className={`group relative w-full overflow-hidden rounded-xl p-4 text-left font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${isSelected
                                                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/50'
                                                : 'bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 border border-slate-700/50 hover:border-violet-500/30'
                                                }`}
                                        >
                                            <div className="relative z-10 flex items-center gap-3">
                                                <div
                                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${isSelected
                                                        ? 'bg-white text-violet-600'
                                                        : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'
                                                        }`}
                                                >
                                                    {String.fromCharCode(65 + index)}
                                                </div>
                                                <span className="min-w-0 break-words">{option}</span>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </Card>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation & Submit */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                    <Button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        variant="secondary"
                        className="px-4 py-2"
                    >
                        <ChevronLeft size={20} className="mr-2" />
                        Previous
                    </Button>

                    {currentIndex === questions.length - 1 ? (
                        <Button
                            onClick={onSubmit}
                            disabled={!hasAnsweredAny || isLoading}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold py-3 rounded-xl"
                        >
                            {isLoading ? 'Submitting...' : 'Submit Quiz'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl"
                        >
                            Next
                            <ChevronRight size={20} className="ml-2" />
                        </Button>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
