'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ButtonProps {
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
}

function Button({ onClick, variant, disabled, className, children }: ButtonProps) {
    const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClasses = variant === 'secondary'
        ? 'bg-slate-700 hover:bg-slate-600 text-white'
        : 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses} ${className || ''}`}
        >
            {children}
        </button>
    );
}

interface CardProps {
    onClick?: () => void;
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
    const [showFeedback, setShowFeedback] = useState(false);

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const allAnswered = Object.values(answers).every(ans => ans !== null);

    useEffect(() => {
        if (!timeLimit) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 1) {
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
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 500);
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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-12"
        >
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-violet-600/10 to-cyan-600/5 rounded-full blur-3xl"
                    animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tl from-cyan-600/10 to-violet-600/5 rounded-full blur-3xl"
                    animate={{ y: [0, -40, 0], x: [0, -20, 0] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
                {/* Header with Progress & Timer */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-violet-400">
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            {currentQuestion.topic && (
                                <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">
                                    {currentQuestion.topic}
                                </span>
                            )}
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
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
                            className={`ml-6 flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-xl border ${isTimeRunningOut
                                ? 'border-red-500/50 bg-red-500/10'
                                : 'border-cyan-500/30 bg-cyan-500/10'
                                }`}
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
                        <Card className="p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-violet-500/20 backdrop-blur-xl">
                            <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
                                {currentQuestion.question}
                            </h2>

                            {/* Options */}
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => {
                                    const isSelected = answers[currentQuestion.id] === index;
                                    const isCorrect = index === currentQuestion.correctAnswer;

                                    return (
                                        <motion.button
                                            key={index}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => handleAnswerClick(index)}
                                            className={`w-full p-4 rounded-xl text-left font-medium transition-all duration-300 group relative overflow-hidden ${isSelected
                                                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/50'
                                                : 'bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 border border-slate-700/50 hover:border-violet-500/30'
                                                }`}
                                        >
                                            {/* Gradient Border Glow */}
                                            {isSelected && (
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-cyan-400/20 rounded-xl blur opacity-0"
                                                    animate={{ opacity: [0, 0.5, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                />
                                            )}

                                            <div className="relative z-10 flex items-center gap-3">
                                                <div
                                                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs transition-all ${isSelected
                                                        ? 'bg-white text-violet-600'
                                                        : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'
                                                        }`}
                                                >
                                                    {String.fromCharCode(65 + index)}
                                                </div>
                                                <span>{option}</span>
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
                    className="flex items-center gap-3"
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
                            disabled={!allAnswered || isLoading}
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

                {/* Keyboard Hint */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-slate-500 text-center mt-6"
                >
                    Use arrow keys to navigate • Press Enter to submit
                </motion.p>
            </div>
        </motion.div>
    );
}
