'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type React from 'react';
import studyServiceInstance from '@/lib/studyService';
import { NotesViewPremium } from '@/components/NotesViewPremium';
import { TopicsGrid } from '@/components/TopicsGrid';
import { QuizScreenPremium } from '@/components/QuizScreenPremium';
import { ResultsScreenPremium } from '@/components/ResultsScreenPremium';
import { QuizScreenSkeleton } from '@/components/SkeletonLoaders';
import { AlertCircle, Link as LinkIcon, PlusCircle } from 'lucide-react';
import type {
    MockQuestionResult,
    MockQuiz,
    MockQuizResult,
    MockRecommendation,
} from '@/lib/mockDataService';

const studyService = studyServiceInstance;

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
        ? 'bg-slate-700 text-white hover:bg-slate-600'
        : 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500';

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
        <div className={`rounded-lg ${className || ''}`}>
            {children}
        </div>
    );
}

interface QuizResult {
    score: number;
    totalQuestions: number;
    percentage: number;
    weakAreas: Array<{ topic: string; percentage: number }>;
    strongAreas: Array<{ topic: string; percentage: number }>;
    results?: MockQuestionResult[];
    quizId?: string;
    timestamp?: string;
}

interface PremiumQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    topic?: string;
}

interface PremiumQuiz {
    id: string;
    title: string;
    questions: PremiumQuestion[];
    createdAt?: string;
}

interface WorkspaceState {
    stage: 'input' | 'loading-notes' | 'notes-display' | 'topics' | 'quiz' | 'results' | 'recommendations';
    notes: string;
    topics: Array<{ id: string; name: string; count: number }>;
    quiz: PremiumQuiz | null;
    quizAnswers: Record<string, number | null>;
    quizResults: QuizResult | null;
    recommendations: MockRecommendation[];
    selectedTopic: string | null;
    error: string | null;
    isLoading: boolean;
}

const toPremiumQuiz = (quiz: MockQuiz): PremiumQuiz => ({
    id: quiz.id,
    title: quiz.title,
    createdAt: quiz.createdAt,
    questions: quiz.questions
        .filter(question => Array.isArray(question.options) && question.options.length > 0)
        .map(question => {
            const options = question.options || [];
            const correctIndex = options.findIndex(option => option === question.correctAnswer);

            return {
                id: question.id,
                question: question.question,
                options,
                correctAnswer: correctIndex >= 0 ? correctIndex : 0,
                topic: question.topic,
            };
        }),
});

const getTopicPercentages = (results: MockQuestionResult[]) => {
    const scores = new Map<string, { correct: number; total: number }>();

    results.forEach(result => {
        const current = scores.get(result.topic) || { correct: 0, total: 0 };
        scores.set(result.topic, {
            correct: current.correct + (result.isCorrect ? 1 : 0),
            total: current.total + 1,
        });
    });

    return scores;
};

const normalizeAreas = (
    areas: string[],
    results: MockQuestionResult[]
): Array<{ topic: string; percentage: number }> => {
    const percentages = getTopicPercentages(results);

    return areas.map(topic => {
        const score = percentages.get(topic);
        return {
            topic,
            percentage: score ? Math.round((score.correct / score.total) * 100) : 0,
        };
    });
};

const toQuizResult = (evaluation: MockQuizResult): QuizResult => ({
    ...evaluation,
    weakAreas: normalizeAreas(evaluation.weakAreas, evaluation.results),
    strongAreas: normalizeAreas(evaluation.strongAreas, evaluation.results),
});

export function WorkspaceCompletePremium() {
    const [state, setWorkspaceState] = useState<WorkspaceState>({
        stage: 'input',
        notes: '',
        topics: [],
        quiz: null,
        quizAnswers: {},
        quizResults: null,
        recommendations: [],
        selectedTopic: null,
        error: null,
        isLoading: false,
    });

    const [inputUrls, setInputUrls] = useState<string[]>(['']);

    // Handle Generate Notes
    const handleGenerateNotes = async (urls: string[]) => {
        if (!urls.some(url => url.trim())) {
            setWorkspaceState(prev => ({
                ...prev,
                error: 'Please enter at least one URL or text',
            }));
            return;
        }

        setWorkspaceState(prev => ({
            ...prev,
            stage: 'loading-notes',
            error: null,
            isLoading: true,
        }));

        try {
            const generatedNotes = await studyService.generateNotes();
            const extractedTopics = await studyService.getTopics();

            setWorkspaceState(prev => ({
                ...prev,
                stage: 'notes-display',
                notes: typeof generatedNotes === 'string' ? generatedNotes : generatedNotes.markdown || '',
                topics: extractedTopics.map(topic => ({
                    id: topic.id,
                    name: topic.name,
                    count: topic.questionsCount || 0,
                })),
                isLoading: false,
            }));
        } catch (error) {
            setWorkspaceState(prev => ({
                ...prev,
                error: `Error generating notes: ${error instanceof Error ? error.message : 'Unknown error'}`,
                stage: 'input',
                isLoading: false,
            }));
        }
    };

    // Handle Generate Quiz
    const handleGenerateQuiz = async (topicFilter?: string) => {
        setWorkspaceState(prev => ({
            ...prev,
            stage: 'quiz',
            isLoading: true,
            selectedTopic: topicFilter || null,
        }));

        try {
            const quiz = toPremiumQuiz(await studyService.generateQuiz(topicFilter));
            const initialAnswers: Record<string, number | null> = {};
            quiz.questions.forEach(q => {
                initialAnswers[q.id] = null;
            });

            setWorkspaceState(prev => ({
                ...prev,
                quiz,
                quizAnswers: initialAnswers,
                isLoading: false,
            }));
        } catch (error) {
            setWorkspaceState(prev => ({
                ...prev,
                error: `Error generating quiz: ${error instanceof Error ? error.message : 'Unknown error'}`,
                stage: 'topics',
                isLoading: false,
            }));
        }
    };

    // Handle Answer Question
    const handleAnswerQuestion = (questionId: string, answerIndex: number) => {
        setWorkspaceState(prev => ({
            ...prev,
            quizAnswers: {
                ...prev.quizAnswers,
                [questionId]: answerIndex,
            },
        }));
    };

    // Handle Submit Quiz
    const handleSubmitQuiz = async () => {
        setWorkspaceState(prev => ({
            ...prev,
            isLoading: true,
        }));

        try {
            const stringAnswers: Record<string, string> = {};
            state.quiz?.questions.forEach(question => {
                const selectedIndex = state.quizAnswers[question.id];
                if (selectedIndex !== null && selectedIndex !== undefined) {
                    stringAnswers[question.id] = question.options[selectedIndex] || '';
                }
            });
            const evaluation = await studyService.evaluateQuiz(stringAnswers);

            setWorkspaceState(prev => ({
                ...prev,
                stage: 'results',
                quizResults: toQuizResult(evaluation),
                isLoading: false,
            }));
        } catch (error) {
            setWorkspaceState(prev => ({
                ...prev,
                error: `Error submitting quiz: ${error instanceof Error ? error.message : 'Unknown error'}`,
                isLoading: false,
            }));
        }
    };

    // Handle Get Recommendations
    const handleGetRecommendations = async () => {
        if (!state.quizResults) return;

        setWorkspaceState(prev => ({
            ...prev,
            stage: 'recommendations',
            isLoading: true,
        }));

        try {
            const weakAreaTopics = state.quizResults.weakAreas.map(area => area.topic);
            const recommendations = await studyService.getRecommendations(weakAreaTopics);

            setWorkspaceState(prev => ({
                ...prev,
                recommendations,
                isLoading: false,
            }));
        } catch (error) {
            setWorkspaceState(prev => ({
                ...prev,
                error: `Error getting recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
                isLoading: false,
            }));
        }
    };

    // Handle Retake Quiz
    const handleRetakeQuiz = (topicId?: string) => {
        handleGenerateQuiz(topicId);
    };

    // Handle Reset
    const handleReset = () => {
        setWorkspaceState({
            stage: 'input',
            notes: '',
            topics: [],
            quiz: null,
            quizAnswers: {},
            quizResults: null,
            recommendations: [],
            selectedTopic: null,
            error: null,
            isLoading: false,
        });
        setInputUrls(['']);
    };

    // Render functions
    const renderInputStage = () => (
        <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 sm:px-6 md:p-12 flex items-center justify-center"
        >
            <div className="max-w-2xl w-full">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-8 sm:mb-12"
                >
                    <h1 className="text-4xl sm:text-5xl font-black mb-4 bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                        Just Before Exam
                    </h1>
                    <p className="text-base sm:text-xl text-slate-300">
                        Master any topic with AI-powered study materials
                    </p>
                </motion.div>

                <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-violet-500/20 backdrop-blur-xl">
                    <div className="space-y-6">
                        <div>
                            <label id="study-materials-label" className="block text-sm font-semibold text-white mb-3">
                                Enter Study Materials
                            </label>
                            {inputUrls.map((url, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="mb-3 flex flex-col gap-2 sm:flex-row"
                                >
                                    <input
                                        id={`study-material-${index}`}
                                        aria-labelledby="study-materials-label"
                                        aria-label={`Study material ${index + 1}`}
                                        type="text"
                                        value={url}
                                        onChange={e => {
                                            const newUrls = [...inputUrls];
                                            newUrls[index] = e.target.value;
                                            setInputUrls(newUrls);
                                        }}
                                        placeholder="Enter URL or paste text..."
                                        className="min-h-11 min-w-0 flex-1 px-4 py-3 rounded-lg bg-slate-900/50 border border-violet-500/20 text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus:border-violet-500/50 focus:bg-slate-900/70 transition-all"
                                    />
                                    {inputUrls.length > 1 && (
                                        <Button
                                            onClick={() => setInputUrls(inputUrls.filter((_, i) => i !== index))}
                                            variant="secondary"
                                            className="shrink-0 px-3"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        <Button
                            onClick={() => {
                                setInputUrls([...inputUrls, '']);
                            }}
                            variant="secondary"
                            className="w-full"
                        >
                            <PlusCircle size={18} className="mr-2" /> Add Another Material
                        </Button>

                        <Button
                            onClick={() => handleGenerateNotes(inputUrls)}
                            disabled={state.isLoading}
                            className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl"
                        >
                            {state.isLoading ? 'Generating Notes...' : 'Generate Study Notes'}
                        </Button>
                    </div>
                </Card>
            </div>
        </motion.div>
    );

    const renderLoadingNotes = () => (
        <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-12 flex items-center justify-center"
        >
            <div className="max-w-2xl w-full">
                <QuizScreenSkeleton />
            </div>
        </motion.div>
    );

    const renderNotesDisplay = () => (
        <motion.div
            key="notes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <NotesViewPremium content={state.notes} />

            {state.topics.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-12"
                >
                    <TopicsGrid
                        topics={state.topics.map(t => ({
                            id: t.id,
                            name: t.name,
                            count: t.count,
                        }))}
                        selectedTopic={state.selectedTopic}
                        onTopicSelect={topicId => {
                            if (topicId) {
                                handleGenerateQuiz(topicId);
                            } else {
                                setWorkspaceState(prev => ({ ...prev, selectedTopic: null }));
                            }
                        }}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 flex flex-col gap-3 sm:flex-row"
                    >
                        <Button
                            onClick={() => handleGenerateQuiz()}
                            className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl"
                        >
                            Start Quiz
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="secondary"
                            className="sm:px-6"
                        >
                            Reset
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );

    const renderQuiz = () => (
        <AnimatePresence mode="wait">
            {state.isLoading && !state.quiz?.questions.length && (
                <motion.div
                    key="quiz-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-12 flex items-center justify-center"
                >
                    <QuizScreenSkeleton />
                </motion.div>
            )}
            {state.quiz?.questions && state.quiz.questions.length > 0 && (
                <QuizScreenPremium
                    key="quiz"
                    questions={state.quiz.questions}
                    onAnswerSelected={handleAnswerQuestion}
                    onSubmit={handleSubmitQuiz}
                    answers={state.quizAnswers}
                    isLoading={state.isLoading}
                />
            )}
        </AnimatePresence>
    );

    const renderResults = () => (
        <AnimatePresence mode="wait">
            {state.quizResults && (
                <ResultsScreenPremium
                    key="results"
                    score={state.quizResults.score}
                    totalQuestions={state.quizResults.totalQuestions}
                    weakAreas={state.quizResults.weakAreas || []}
                    strongAreas={state.quizResults.strongAreas || []}
                    onRetake={() => handleRetakeQuiz(state.selectedTopic || undefined)}
                    onViewRecommendations={handleGetRecommendations}
                    onStartOver={handleReset}
                />
            )}
        </AnimatePresence>
    );

    const renderRecommendations = () => (
        <motion.div
            key="recommendations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 sm:px-6 md:p-12"
        >
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                        Recommended Resources
                    </h1>
                    <p className="text-slate-400">
                        Based on your quiz performance, here are resources to strengthen your weak areas
                    </p>
                </motion.div>

                {state.isLoading ? (
                    <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading recommendations">
                        {[0, 1, 2].map(item => (
                            <div
                                key={item}
                                className="h-28 rounded-lg border border-violet-500/10 bg-slate-800/30 animate-pulse"
                            />
                        ))}
                    </div>
                ) : (
                <div className="grid gap-4">
                    {state.recommendations.map((rec, index) => (
                        <motion.div
                            key={rec.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-violet-500/20 backdrop-blur-xl hover:border-violet-500/40 transition-all">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-bold text-white mb-1 break-words">{rec.title}</h3>
                                        <p className="text-slate-400 text-sm mb-3">{rec.description}</p>
                                        <div className="flex gap-2 flex-wrap">
                                            <span className="text-xs px-3 py-1 rounded-full bg-violet-500/20 text-violet-300">
                                                {rec.type}
                                            </span>
                                            <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300">
                                                {rec.topic}
                                            </span>
                                        </div>
                                    </div>
                                    <a
                                        href={rec.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-3 font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                                        aria-label={`View resource: ${rec.title}`}
                                    >
                                        <LinkIcon size={16} className="mr-2" /> View
                                    </a>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 flex flex-col gap-3 sm:flex-row"
                >
                    <Button
                        onClick={() => handleRetakeQuiz()}
                        variant="secondary"
                        className="flex-1"
                    >
                        Retake Quiz
                    </Button>
                    <Button
                        onClick={handleReset}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl"
                    >
                        Start New Session
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );

    const renderError = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-12 flex items-center justify-center"
        >
            <Card className="max-w-md w-full p-6 border border-red-500/20 bg-red-500/5">
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

    if (state.error) {
        return renderError();
    }

    return (
        <AnimatePresence mode="wait">
            {state.stage === 'input' && renderInputStage()}
            {state.stage === 'loading-notes' && renderLoadingNotes()}
            {state.stage === 'notes-display' && renderNotesDisplay()}
            {state.stage === 'topics' && renderNotesDisplay()}
            {state.stage === 'quiz' && renderQuiz()}
            {state.stage === 'results' && renderResults()}
            {state.stage === 'recommendations' && renderRecommendations()}
        </AnimatePresence>
    );
}
