"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    RotateCcw,
    AlertCircle,
    CheckCircle,
    Loader,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import studyService from "@/lib/studyService";
import type {
    MockTopic,
    MockQuiz,
    MockQuizResult,
    MockRecommendation,
} from "@/lib/mockDataService";

// ============================================================================
// TYPES
// ============================================================================

export type WorkflowStage =
    | "input"
    | "loading-notes"
    | "notes-display"
    | "topics"
    | "quiz"
    | "results"
    | "recommendations";

interface WorkspaceState {
    stage: WorkflowStage;
    notes: string;
    topics: MockTopic[];
    quiz: MockQuiz | null;
    quizAnswers: Record<string, string>;
    quizResults: MockQuizResult | null;
    recommendations: MockRecommendation[];
    selectedTopic: string | null;
    error: string | null;
    isLoading: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function Workspace() {
    const [state, setState] = useState<WorkspaceState>({
        stage: "input",
        notes: "",
        topics: [],
        quiz: null,
        quizAnswers: {},
        quizResults: null,
        recommendations: [],
        selectedTopic: null,
        error: null,
        isLoading: false,
    });

    // =========================================================================
    // HANDLERS
    // =========================================================================

    const handleGenerateNotes = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            stage: "loading-notes",
            isLoading: true,
            error: null,
        }));

        try {
            const { markdown, topics } = await studyService.generateNotes();

            setState((prev) => ({
                ...prev,
                notes: markdown,
                topics,
                stage: "notes-display",
                isLoading: false,
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to generate notes",
                stage: "input",
                isLoading: false,
            }));
        }
    }, []);

    const handleGenerateQuiz = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            isLoading: true,
            error: null,
        }));

        try {
            const quiz = await studyService.generateQuiz(state.selectedTopic || undefined);

            setState((prev) => ({
                ...prev,
                quiz,
                stage: "quiz",
                quizAnswers: {},
                isLoading: false,
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to generate quiz",
                isLoading: false,
            }));
        }
    }, [state.selectedTopic]);

    const handleAnswerQuestion = useCallback(
        (questionId: string, answer: string) => {
            setState((prev) => ({
                ...prev,
                quizAnswers: {
                    ...prev.quizAnswers,
                    [questionId]: answer,
                },
            }));
        },
        []
    );

    const handleSubmitQuiz = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            isLoading: true,
            error: null,
        }));

        try {
            const results = await studyService.evaluateQuiz(state.quizAnswers);

            setState((prev) => ({
                ...prev,
                quizResults: results,
                stage: "results",
                isLoading: false,
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to evaluate quiz",
                isLoading: false,
            }));
        }
    }, [state.quizAnswers]);

    const handleGetRecommendations = useCallback(async () => {
        if (!state.quizResults) return;

        setState((prev) => ({
            ...prev,
            isLoading: true,
            error: null,
        }));

        try {
            const recommendations = await studyService.getRecommendations(
                state.quizResults.weakAreas
            );

            setState((prev) => ({
                ...prev,
                recommendations,
                stage: "recommendations",
                isLoading: false,
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch recommendations",
                isLoading: false,
            }));
        }
    }, [state.quizResults]);

    const handleRetakeQuiz = useCallback(() => {
        setState((prev) => ({
            ...prev,
            stage: "quiz",
            quizAnswers: {},
            quiz: prev.quiz,
        }));
    }, []);

    const handleReset = useCallback(() => {
        setState({
            stage: "input",
            notes: "",
            topics: [],
            quiz: null,
            quizAnswers: {},
            quizResults: null,
            recommendations: [],
            selectedTopic: null,
            error: null,
            isLoading: false,
        });
    }, []);

    // =========================================================================
    // COMPUTED VALUES
    // =========================================================================

    const allQuestionsAnswered =
        state.quiz &&
        state.quiz.questions.length > 0 &&
        state.quiz.questions.every((q) => state.quizAnswers[q.id]);

    // =========================================================================
    // RENDER STAGES
    // =========================================================================

    const renderInputStage = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <Card className="p-8 text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">Study Materials</h1>
                    <p className="text-slate-300">
                        Start by generating study notes from your learning materials
                    </p>
                </div>

                <Button
                    onClick={handleGenerateNotes}
                    disabled={state.isLoading}
                    className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition"
                >
                    {state.isLoading ? (
                        <>
                            <Loader className="animate-spin mr-2" size={18} />
                            Generating Notes...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2" size={18} />
                            Generate Study Notes
                        </>
                    )}
                </Button>

                <p className="text-xs text-slate-400">
                    This uses mock data for demonstration. Connect to backend when ready.
                </p>
            </Card>
        </motion.div>
    );

    const renderLoadingNotes = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <Card className="p-8 space-y-4">
                <div className="flex items-center gap-3">
                    <Loader className="animate-spin text-violet-400" size={24} />
                    <h2 className="text-xl font-semibold text-white">
                        Generating Notes...
                    </h2>
                </div>
                <div className="space-y-2">
                    <p className="text-slate-300 text-sm">
                        Analyzing your study materials and generating comprehensive notes
                    </p>
                    <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="h-2 w-8 bg-violet-500 rounded"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                            />
                        ))}
                    </div>
                </div>
            </Card>
        </motion.div>
    );

    const renderNotesDisplay = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Notes Display */}
            <Card className="p-6 max-h-96 overflow-y-auto">
                <div className="prose prose-invert max-w-none">
                    <div className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
                        {state.notes.split("\n").slice(0, 30).join("\n")}
                        {state.notes.split("\n").length > 30 && (
                            <p className="text-slate-400 italic mt-4">... [notes continue]</p>
                        )}
                    </div>
                </div>
            </Card>

            {/* Topics Section */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Topics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {state.topics.map((topic) => (
                        <motion.button
                            key={topic.id}
                            onClick={() =>
                                setState((prev) => ({
                                    ...prev,
                                    selectedTopic:
                                        prev.selectedTopic === topic.id ? null : topic.id,
                                }))
                            }
                            className={`p-4 rounded-lg border-2 transition text-left ${state.selectedTopic === topic.id
                                ? "border-violet-500 bg-violet-500/10"
                                : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                                }`}
                            whileHover={{ y: -2 }}
                        >
                            <h4 className="font-semibold text-white">{topic.name}</h4>
                            <p className="text-sm text-slate-400 mt-1">{topic.description}</p>
                            <p className="text-xs text-slate-500 mt-2">
                                {topic.questionsCount} questions
                            </p>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <Button
                    onClick={handleGenerateQuiz}
                    disabled={state.isLoading}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-blue-500"
                >
                    {state.isLoading ? "Generating Quiz..." : "Generate Quiz"}
                </Button>
                <Button
                    onClick={handleReset}
                    variant="secondary"
                    className="flex-1"
                >
                    <RotateCcw size={18} className="mr-2" />
                    Start Over
                </Button>
            </div>
        </motion.div>
    );

    const renderQuiz = () => {
        if (!state.quiz) return null;

        const progress =
            (Object.keys(state.quizAnswers).length / state.quiz.questions.length) *
            100;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <Card className="p-6 space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300">
                                Progress: {Object.keys(state.quizAnswers).length} /{" "}
                                {state.quiz.questions.length}
                            </span>
                            <span className="text-violet-400 font-semibold">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-violet-500 to-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>

                    {/* Questions List */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-white">Answer All Questions:</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {state.quiz.questions.map((question, idx) => {
                                const isAnswered = !!state.quizAnswers[question.id];
                                return (
                                    <motion.div
                                        key={question.id}
                                        className={`p-3 rounded-lg border border-slate-700 ${isAnswered
                                            ? "bg-emerald-500/10 border-emerald-500/30"
                                            : "bg-slate-800/50"
                                            }`}
                                        whileHover={{ x: 4 }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">
                                                    {idx + 1}. {question.question}
                                                </p>
                                                {isAnswered && (
                                                    <p className="text-xs text-emerald-400 mt-1">
                                                        Answer: {state.quizAnswers[question.id]}
                                                    </p>
                                                )}
                                            </div>
                                            {isAnswered && (
                                                <CheckCircle size={16} className="text-emerald-400" />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Simplified Answer Entry - Pick first unanswered */}
                    {Object.keys(state.quizAnswers).length < state.quiz.questions.length &&
                        (() => {
                            const unanswered = state.quiz.questions.find(
                                (q) => !state.quizAnswers[q.id]
                            );
                            if (!unanswered) return null;

                            return (
                                <div className="border-t border-slate-700 pt-4 mt-4 space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-white mb-3">
                                            {unanswered.question}
                                        </h4>
                                        {unanswered.type === "mcq" && unanswered.options && (
                                            <div className="space-y-2">
                                                {unanswered.options.map((option, idx) => (
                                                    <motion.button
                                                        key={idx}
                                                        onClick={() =>
                                                            handleAnswerQuestion(unanswered.id, option)
                                                        }
                                                        className="w-full text-left p-3 rounded-lg border border-slate-700 hover:border-violet-500 hover:bg-violet-500/10 transition text-white"
                                                        whileHover={{ x: 4 }}
                                                    >
                                                        {option}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                    {/* Submit Button */}
                    <motion.div
                        className="flex gap-3 pt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Button
                            onClick={handleSubmitQuiz}
                            disabled={!allQuestionsAnswered || state.isLoading}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500"
                        >
                            {state.isLoading ? "Submitting..." : "Submit Quiz"}
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="secondary"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </motion.div>
                </Card>
            </motion.div>
        );
    };

    const renderResults = () => {
        if (!state.quizResults) return null;

        const percentage = state.quizResults.percentage;
        const getScoreColor = () => {
            if (percentage >= 80) return "text-emerald-400";
            if (percentage >= 60) return "text-amber-400";
            return "text-red-400";
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Score Card */}
                <Card className="p-8 text-center space-y-4 bg-gradient-to-br from-slate-800 to-slate-900">
                    <h2 className="text-2xl font-bold text-white">Quiz Complete! 🎉</h2>
                    <div className={`text-5xl font-bold ${getScoreColor()}`}>
                        {state.quizResults.percentage}%
                    </div>
                    <p className="text-slate-300">
                        {state.quizResults.score} out of {state.quizResults.totalQuestions}{" "}
                        questions correct
                    </p>
                </Card>

                {/* Weak Areas */}
                {state.quizResults.weakAreas.length > 0 && (
                    <Card className="p-6 space-y-3 border border-orange-500/20 bg-orange-500/5">
                        <h3 className="font-semibold text-orange-400 flex items-center gap-2">
                            <AlertCircle size={18} />
                            Areas to Improve
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {state.quizResults.weakAreas.map((area) => (
                                <span
                                    key={area}
                                    className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm"
                                >
                                    {area}
                                </span>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Strong Areas */}
                {state.quizResults.strongAreas.length > 0 && (
                    <Card className="p-6 space-y-3 border border-emerald-500/20 bg-emerald-500/5">
                        <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
                            <CheckCircle size={18} />
                            Strong Areas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {state.quizResults.strongAreas.map((area) => (
                                <span
                                    key={area}
                                    className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm"
                                >
                                    {area}
                                </span>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Review Results */}
                <Card className="p-6 space-y-4">
                    <h3 className="font-semibold text-white">Answer Review</h3>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                        {state.quizResults.results.slice(0, 5).map((result) => (
                            <div
                                key={result.questionId}
                                className={`p-3 rounded-lg border ${result.isCorrect
                                    ? "border-emerald-500/30 bg-emerald-500/10"
                                    : "border-red-500/30 bg-red-500/10"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p
                                            className={`text-sm font-medium ${result.isCorrect
                                                ? "text-emerald-300"
                                                : "text-red-300"
                                                }`}
                                        >
                                            Q: {result.question.substring(0, 50)}...
                                        </p>
                                        {!result.isCorrect && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                Your answer: {result.userAnswer}
                                            </p>
                                        )}
                                    </div>
                                    {result.isCorrect ? (
                                        <CheckCircle
                                            size={18}
                                            className="text-emerald-400 flex-shrink-0 mt-1"
                                        />
                                    ) : (
                                        <AlertCircle
                                            size={18}
                                            className="text-red-400 flex-shrink-0 mt-1"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={() => handleGetRecommendations()}
                        disabled={state.isLoading}
                        className="flex-1 bg-gradient-to-r from-violet-500 to-blue-500"
                    >
                        {state.isLoading ? "Loading..." : "Get Recommendations"}
                    </Button>
                    <Button
                        onClick={handleRetakeQuiz}
                        variant="secondary"
                        className="flex-1"
                    >
                        Retake Quiz
                    </Button>
                    <Button
                        onClick={handleReset}
                        variant="secondary"
                        className="flex-1"
                    >
                        Start Over
                    </Button>
                </div>
            </motion.div>
        );
    };

    const renderRecommendations = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <Card className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-white">
                    📚 Recommended Resources
                </h2>
                <p className="text-slate-300">
                    Based on your weak areas, here are resources to help you improve:
                </p>

                <div className="space-y-3">
                    {state.recommendations.map((rec) => (
                        <motion.a
                            key={rec.id}
                            href={rec.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 rounded-lg border border-slate-700 hover:border-violet-500 bg-slate-800/50 hover:bg-slate-800 transition"
                            whileHover={{ y: -2, x: 4 }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-white">{rec.title}</h4>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {rec.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded">
                                            {rec.type}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            Relevance: {Math.round(rec.relevanceScore * 100)}%
                                        </span>
                                    </div>
                                </div>
                                <span className="text-2xl">
                                    {rec.type === "video"
                                        ? "🎥"
                                        : rec.type === "article"
                                            ? "📄"
                                            : "🎮"}
                                </span>
                            </div>
                        </motion.a>
                    ))}
                </div>
            </Card>

            <div className="flex gap-3">
                <Button
                    onClick={handleReset}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-blue-500"
                >
                    Start New Session
                </Button>
            </div>
        </motion.div>
    );

    const renderError = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="p-6 border border-red-500/20 bg-red-500/5">
                <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
                    <div className="flex-1">
                        <h3 className="font-semibold text-red-300 mb-1">Error</h3>
                        <p className="text-red-200 text-sm mb-4">{state.error}</p>
                        <Button
                            onClick={handleReset}
                            variant="secondary"
                            className="text-red-300 border-red-500/30 hover:border-red-500"
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );

    // =========================================================================
    // MAIN RENDER
    // =========================================================================

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-600/8 to-violet-500/4 rounded-full blur-3xl"
                    animate={{ y: [0, 40, 0], x: [0, 25, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tl from-indigo-600/8 to-indigo-500/4 rounded-full blur-3xl"
                    animate={{ y: [0, -40, 0], x: [0, -25, 0] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:py-12 lg:py-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent mb-2">
                        justBeforExam
                    </h1>
                    <p className="text-slate-300">
                        AI-Powered Study Companion
                    </p>
                </motion.div>

                {/* Error Display */}
                {state.error && renderError()}

                {/* Stage Renderer */}
                <AnimatePresence mode="wait">
                    {state.stage === "input" && renderInputStage()}
                    {state.stage === "loading-notes" && renderLoadingNotes()}
                    {state.stage === "notes-display" && renderNotesDisplay()}
                    {state.stage === "quiz" && renderQuiz()}
                    {state.stage === "results" && renderResults()}
                    {state.stage === "recommendations" && renderRecommendations()}
                </AnimatePresence>
            </div>
        </div>
    );
}
