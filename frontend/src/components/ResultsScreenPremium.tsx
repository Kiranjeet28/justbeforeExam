'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Zap, Target } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ButtonProps {
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    className?: string;
    children: React.ReactNode;
}

function Button({ onClick, variant, className, children }: ButtonProps) {
    const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all duration-200';
    const variantClasses = variant === 'secondary'
        ? 'bg-slate-700 hover:bg-slate-600 text-white'
        : 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white';

    return (
        <button
            onClick={onClick}
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
        <div className={`rounded-lg ${className || ''}`}>
            {children}
        </div>
    );
}

interface WeakArea {
    topic: string;
    percentage: number;
}

interface StrongArea {
    topic: string;
    percentage: number;
}

interface ResultsScreenPremiumProps {
    score: number;
    totalQuestions: number;
    weakAreas: WeakArea[];
    strongAreas: StrongArea[];
    onRetake?: () => void;
    onViewRecommendations?: () => void;
    onStartOver?: () => void;
}

export function ResultsScreenPremium({
    score,
    totalQuestions,
    weakAreas,
    strongAreas,
    onRetake,
    onViewRecommendations,
    onStartOver,
}: ResultsScreenPremiumProps) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setDisplayScore(prev => {
                if (prev >= percentage) {
                    clearInterval(timer);
                    return percentage;
                }
                return prev + 2;
            });
        }, 30);
        return () => clearInterval(timer);
    }, [percentage]);

    const getScoreColor = () => {
        if (percentage >= 80) return 'from-emerald-500 to-green-500';
        if (percentage >= 60) return 'from-amber-500 to-orange-500';
        return 'from-red-500 to-pink-500';
    };

    const getScoreBadge = () => {
        if (percentage >= 90) return { emoji: '🔥', text: 'Outstanding!' };
        if (percentage >= 80) return { emoji: '⭐', text: 'Excellent!' };
        if (percentage >= 70) return { emoji: '👏', text: 'Good!' };
        if (percentage >= 60) return { emoji: '💪', text: 'Keep Going!' };
        return { emoji: '🚀', text: 'Try Again!' };
    };

    const badge = getScoreBadge();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-12"
        >
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-40 right-40 w-80 h-80 bg-gradient-to-br from-violet-600/15 to-cyan-600/5 rounded-full blur-3xl"
                    animate={{
                        y: [0, 60, 0],
                        x: [0, 30, 0],
                        scale: [0.9, 1.1, 0.9],
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
                <motion.div
                    className="absolute -bottom-40 left-1/3 w-96 h-96 bg-gradient-to-tl from-cyan-600/15 to-violet-600/5 rounded-full blur-3xl"
                    animate={{
                        y: [0, -60, 0],
                        x: [0, -30, 0],
                        scale: [1.1, 0.9, 1.1],
                    }}
                    transition={{ duration: 12, repeat: Infinity }}
                />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
                {/* Score Circle Animation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                    className="mb-12 flex flex-col items-center"
                >
                    <div className="relative w-48 h-48 mb-6">
                        {/* Outer Glow */}
                        <motion.div
                            className={`absolute inset-0 rounded-full bg-gradient-to-r ${getScoreColor()} opacity-20 blur-2xl`}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />

                        {/* Circle Background */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                fill="none"
                                stroke="rgb(51, 65, 85)"
                                strokeWidth="8"
                            />
                            <motion.circle
                                cx="96"
                                cy="96"
                                r="88"
                                fill="none"
                                stroke="url(#scoreGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: '0 553' }}
                                animate={{ strokeDasharray: `${(displayScore / 100) * 553} 553` }}
                                transition={{ duration: 2, ease: 'easeOut' }}
                            />
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="rgb(139, 92, 246)" />
                                    <stop offset="100%" stopColor="rgb(34, 211, 238)" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                className={`text-5xl font-black bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity, repeatType: 'mirror' }}
                            >
                                {displayScore}%
                            </motion.span>
                            <span className="text-sm text-slate-400">Accuracy</span>
                        </div>
                    </div>

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-center"
                    >
                        <div className="text-4xl mb-2">{badge.emoji}</div>
                        <h2 className="text-2xl font-bold text-white mb-1">{badge.text}</h2>
                        <p className="text-slate-400">You scored {score} out of {totalQuestions} questions</p>
                    </motion.div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-4 mb-8"
                >
                    <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-violet-500/20 backdrop-blur-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy size={18} className="text-amber-400" />
                            <span className="text-xs text-slate-400">Correct Answers</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{score}/{totalQuestions}</p>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 backdrop-blur-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={18} className="text-cyan-400" />
                            <span className="text-xs text-slate-400">XP Earned</span>
                        </div>
                        <motion.p
                            className="text-2xl font-bold text-white"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.6, delay: 1 }}
                        >
                            +{score * 10}
                        </motion.p>
                    </Card>
                </motion.div>

                {/* Weak Areas */}
                {weakAreas.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <Target size={18} className="text-red-400" />
                            <h3 className="font-semibold text-white">Areas for Improvement</h3>
                        </div>
                        <div className="space-y-2 mb-8">
                            {weakAreas.map((area, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + index * 0.1 }}
                                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-red-300">{area.topic}</span>
                                        <span className="text-xs text-red-400">{area.percentage}% correct</span>
                                    </div>
                                    <div className="w-full h-1 bg-red-900/30 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-red-500 to-red-600"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${area.percentage}%` }}
                                            transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Strong Areas */}
                {strongAreas.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-400" />
                            <h3 className="font-semibold text-white">Your Strengths</h3>
                        </div>
                        <div className="space-y-2 mb-8">
                            {strongAreas.map((area, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 + index * 0.1 }}
                                    className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-emerald-300">{area.topic}</span>
                                        <span className="text-xs text-emerald-400">{area.percentage}% correct</span>
                                    </div>
                                    <div className="w-full h-1 bg-emerald-900/30 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-green-600"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${area.percentage}%` }}
                                            transition={{ duration: 0.8, delay: 1 + index * 0.1 }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="flex flex-col gap-3"
                >
                    <Button
                        onClick={onViewRecommendations}
                        className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl"
                    >
                        View Recommendations
                    </Button>

                    {weakAreas.length > 0 && (
                        <Button
                            onClick={onRetake}
                            variant="secondary"
                            className="w-full py-3"
                        >
                            Retake Weak Areas Quiz
                        </Button>
                    )}

                    <Button
                        onClick={onStartOver}
                        variant="secondary"
                        className="w-full py-3"
                    >
                        Start New Session
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
}
