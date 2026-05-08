"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  BookOpen,
  HelpCircle,
  Trophy,
  AlertCircle,
  Loader,
  Menu,
  X,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { InputSection } from "./InputSection";
import { ImprovedNotesView } from "./ImprovedNotesView";
import { QuizView, type QuizQuestion } from "./QuizView";
import { ResultsView, type QuestionResult } from "./ResultsView";
import { WeakAreasAnalysis, type WeakTopic } from "./WeakAreasAnalysis";
import {
  RecommendationsCard,
  type Recommendation,
} from "./RecommendationsCard";
import TestResourcesSidebar from "./TestResourcesSidebar";

/**
 * Utility function to combine class names
 */
function cn(...classes: (string | undefined | false | null)[]): string {
  return classes
    .filter((className): className is string => typeof className === "string")
    .join(" ");
}

/**
 * Section types for the main layout
 */
type SectionType = "input" | "notes" | "quiz" | "results";

/**
 * Quiz state interface
 */
interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string>;
  submitted: boolean;
}

/**
 * Results state interface
 */
interface ResultsState {
  score: number;
  totalQuestions: number;
  results: QuestionResult[];
  weakTopics: WeakTopic[];
  recommendations: Recommendation[];
  timestamp: Date;
}

/**
 * Props for ImprovedMainLayout
 */
export interface ImprovedMainLayoutProps {
  /**
   * Initial section to display
   * @default "input"
   */
  initialSection?: SectionType;

  /**
   * Callback when generating notes from URL
   */
  onGenerateNotes?: (url: string) => Promise<string>;

  /**
   * Callback when generating quiz from URL
   */
  onGenerateQuiz?: (url: string) => Promise<QuizQuestion[]>;

  /**
   * Callback when submitting quiz answers
   */
  onSubmitQuiz?: (
    answers: Record<string, string>,
  ) => Promise<{ results: QuestionResult[]; weakTopics: WeakTopic[] }>;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Whether to show sidebar on mobile
   * @default true
   */
  showSidebarOnMobile?: boolean;
}

/**
 * Section configuration for navigation
 */
interface SectionConfig {
  id: SectionType;
  label: string;
  icon: React.ReactNode;
  step: number;
}

const SECTION_CONFIG: SectionConfig[] = [
  { id: "input", label: "Input", icon: <BookOpen size={18} />, step: 1 },
  { id: "notes", label: "Notes", icon: <CheckCircle size={18} />, step: 2 },
  { id: "quiz", label: "Quiz", icon: <HelpCircle size={18} />, step: 3 },
  { id: "results", label: "Results", icon: <Trophy size={18} />, step: 4 },
];

/**
 * Progress indicator component
 */
const ProgressIndicator: React.FC<{
  currentStep: number;
  totalSteps: number;
}> = ({ currentStep, totalSteps }) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-300">
          Progress: Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-bold text-violet-400">
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="relative w-full h-2 bg-slate-700/40 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-violet-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
      </div>
    </motion.div>
  );
};

/**
 * Breadcrumb navigation component
 */
const BreadcrumbNav: React.FC<{
  sections: SectionConfig[];
  currentSection: SectionType;
  onNavigate: (section: SectionType) => void;
  disabledSections: SectionType[];
}> = ({ sections, currentSection, onNavigate, disabledSections }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 overflow-x-auto pb-2"
    >
      {sections.map((section, idx) => (
        <React.Fragment key={section.id}>
          <motion.button
            onClick={() =>
              !disabledSections.includes(section.id) && onNavigate(section.id)
            }
            disabled={disabledSections.includes(section.id)}
            whileHover={!disabledSections.includes(section.id) ? { y: -2 } : {}}
            whileTap={
              !disabledSections.includes(section.id) ? { scale: 0.95 } : {}
            }
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
              currentSection === section.id
                ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/20"
                : disabledSections.includes(section.id)
                  ? "bg-slate-700/30 text-slate-500 cursor-not-allowed"
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/70 hover:text-slate-100",
            )}
          >
            {section.icon}
            <span>{section.label}</span>
          </motion.button>

          {idx < sections.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-600"
            >
              <ChevronRight size={16} />
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </motion.div>
  );
};

/**
 * Section wrapper component with header and footer
 */
const SectionWrapper: React.FC<{
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onPrevious?: () => void;
  onNext?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  showPrevious?: boolean;
  showNext?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}> = ({
  title,
  description,
  icon,
  children,
  onPrevious,
  onNext,
  previousLabel = "Previous",
  nextLabel = "Next",
  showPrevious = true,
  showNext = true,
  isLoading = false,
  error = null,
  onRetry = undefined,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20"
          >
            <div className="text-violet-400">{icon}</div>
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            {description && (
              <p className="text-sm text-slate-400 mt-1">{description}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 p-4"
          >
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-300 font-semibold">Error</h3>
                <p className="text-red-200/80 text-sm mt-1">{error}</p>
              </div>
              {onRetry && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onRetry}
                  className="flex-shrink-0"
                >
                  Retry
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mb-4"
            >
              <Loader className="w-8 h-8 text-violet-400" />
            </motion.div>
            <p className="text-slate-300 font-medium">Loading content...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="min-h-[400px]"
        >
          {children}
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3 justify-between pt-4 border-t border-slate-700/50"
      >
        <div className="flex gap-3">
          {showPrevious && onPrevious && (
            <Button
              variant="secondary"
              onClick={onPrevious}
              disabled={isLoading}
              icon={<ChevronLeft size={18} />}
              className="flex-1 sm:flex-initial"
            >
              {previousLabel}
            </Button>
          )}
        </div>

        {showNext && onNext && (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={isLoading}
            isLoading={isLoading}
            icon={<ChevronRight size={18} />}
            iconPosition="right"
            className="flex-1 sm:flex-initial"
          >
            {nextLabel}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
};

/**
 * ImprovedMainLayout Component
 *
 * A comprehensive master layout component that brings together:
 * - Input section for URL entry
 * - Notes section for displaying generated notes
 * - Quiz section for taking quizzes
 * - Results section for showing scores and weak areas
 *
 * Features:
 * - Tab-based navigation between sections
 * - Progress indicator showing current step
 * - Breadcrumb navigation
 * - Smooth Framer Motion transitions
 * - Responsive design with sidebar
 * - Error handling and loading states
 * - Mobile responsive layout
 *
 * @example
 * ```tsx
 * <ImprovedMainLayout
 *   onGenerateNotes={async (url) => { ... }}
 *   onGenerateQuiz={async (url) => { ... }}
 *   onSubmitQuiz={async (answers) => { ... }}
 * />
 * ```
 */
export const ImprovedMainLayout: React.FC<ImprovedMainLayoutProps> = ({
  initialSection = "input",
  onGenerateNotes,
  onGenerateQuiz,
  onSubmitQuiz,
  className,
}) => {
  // ========== State Management ==========
  const [currentSection, setCurrentSection] =
    useState<SectionType>(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Input state
  const [url, setUrl] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [inputLoading, setInputLoading] = useState(false);

  // Notes state
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    answers: {},
    submitted: false,
  });
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Results state
  const [resultsState, setResultsState] = useState<ResultsState | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  // References
  const mainContentRef = useRef<HTMLDivElement>(null);

  // ========== Derived State ==========
  const disabledSections = useMemo<SectionType[]>(() => {
    const sections: SectionType[] = [];
    if (!url) sections.push("notes", "quiz", "results");
    if (!notes) sections.push("quiz", "results");
    if (quizState.questions.length === 0) sections.push("results");
    return sections;
  }, [notes, quizState.questions.length, url]);

  const currentStep =
    SECTION_CONFIG.find((s) => s.id === currentSection)?.step ?? 1;

  // ========== Event Handlers ==========

  /**
   * Handle URL input and generate notes
   */
  const handleGenerateNotes = useCallback(
    async (inputUrl: string) => {
      setInputError(null);
      setNotesError(null);
      setInputLoading(true);
      setNotesLoading(true);

      try {
        setUrl(inputUrl);

        if (onGenerateNotes) {
          const generatedNotes = await onGenerateNotes(inputUrl);
          setNotes(generatedNotes);

          // Scroll to main content
          setTimeout(() => {
            mainContentRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 500);

          // Move to next section
          setCurrentSection("notes");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to generate notes";
        setNotesError(errorMessage);
        console.error("Generate notes error:", error);
      } finally {
        setInputLoading(false);
        setNotesLoading(false);
      }
    },
    [onGenerateNotes],
  );

  /**
   * Handle quiz generation from URL or notes
   */
  const handleGenerateQuiz = useCallback(async () => {
    setQuizError(null);
    setQuizLoading(true);

    try {
      if (onGenerateQuiz) {
        const questions = await onGenerateQuiz(url);
        setQuizState({
          questions,
          currentIndex: 0,
          answers: {},
          submitted: false,
        });

        setCurrentSection("quiz");

        // Scroll to main content
        setTimeout(() => {
          mainContentRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 500);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate quiz";
      setQuizError(errorMessage);
      console.error("Generate quiz error:", error);
    } finally {
      setQuizLoading(false);
    }
  }, [url, onGenerateQuiz]);

  /**
   * Handle quiz answer selection
   */
  const handleAnswerSelect = useCallback(
    (questionId: string, answer: string) => {
      setQuizState((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: answer,
        },
      }));
    },
    [],
  );

  /**
   * Handle moving to next quiz question
   */
  const handleNextQuestion = useCallback(() => {
    setQuizState((prev) => {
      if (prev.currentIndex < prev.questions.length - 1) {
        return {
          ...prev,
          currentIndex: prev.currentIndex + 1,
        };
      }
      return prev;
    });
  }, []);

  /**
   * Handle moving to previous quiz question
   */
  const handlePreviousQuestion = useCallback(() => {
    setQuizState((prev) => {
      if (prev.currentIndex > 0) {
        return {
          ...prev,
          currentIndex: prev.currentIndex - 1,
        };
      }
      return prev;
    });
  }, []);

  /**
   * Handle quiz submission
   */
  const handleSubmitQuiz = useCallback(async () => {
    setResultsError(null);
    setResultsLoading(true);

    try {
      if (onSubmitQuiz) {
        const { results, weakTopics } = await onSubmitQuiz(quizState.answers);

        const score = results.filter((r) => r.isCorrect).length;

        setResultsState({
          score,
          totalQuestions: results.length,
          results,
          weakTopics,
          recommendations: [],
          timestamp: new Date(),
        });

        setQuizState((prev) => ({
          ...prev,
          submitted: true,
        }));

        setCurrentSection("results");

        // Scroll to main content
        setTimeout(() => {
          mainContentRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 500);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit quiz";
      setResultsError(errorMessage);
      console.error("Submit quiz error:", error);
    } finally {
      setResultsLoading(false);
    }
  }, [quizState.answers, onSubmitQuiz]);

  /**
   * Handle retaking quiz
   */
  const handleRetakeQuiz = useCallback(() => {
    setQuizState({
      questions: quizState.questions,
      currentIndex: 0,
      answers: {},
      submitted: false,
    });
    setCurrentSection("quiz");
  }, [quizState.questions]);

  /**
   * Handle section navigation
   */
  const handleNavigateSection = useCallback(
    (section: SectionType) => {
      if (!disabledSections.includes(section)) {
        setCurrentSection(section);
        setTimeout(() => {
          mainContentRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    },
    [disabledSections],
  );

  /**
   * Handle moving to previous section
   */
  const handlePreviousSection = useCallback(() => {
    const currentIndex = SECTION_CONFIG.findIndex(
      (s) => s.id === currentSection,
    );
    if (currentIndex > 0) {
      const previousSection = SECTION_CONFIG[currentIndex - 1].id;
      setCurrentSection(previousSection);
    }
  }, [currentSection]);

  /**
   * Handle sidebar resource selection
   */
  const handleSidebarResourceClick = useCallback((resourceUrl: string) => {
    setUrl(resourceUrl);
    setInputError(null);
  }, []);

  // ========== Render ==========

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950",
        "relative overflow-hidden",
        className,
      )}
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 min-h-screen gap-0 lg:gap-6">
          {/* ========== Sidebar ==========  */}
          <motion.div
            initial={false}
            animate={{
              width: sidebarOpen ? "100%" : 0,
              opacity: sidebarOpen ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="lg:col-span-1 lg:w-full lg:opacity-100 lg:relative absolute lg:static inset-0 z-40"
          >
            <div
              className={cn(
                "h-full px-4 py-6 lg:p-6 overflow-y-auto",
                "bg-gradient-to-b from-slate-800/50 to-slate-900/50",
                "border-r border-slate-700/50 lg:border-r",
                "backdrop-blur-sm",
              )}
            >
              <TestResourcesSidebar
                onSelectLink={handleSidebarResourceClick}
                isLoading={inputLoading}
              />
            </div>
          </motion.div>

          {/* ========== Main Content ==========  */}
          <motion.div
            layout
            className="lg:col-span-3 flex flex-col h-screen lg:h-auto overflow-y-auto"
          >
            <div className="flex-1 px-4 py-6 lg:p-8 space-y-6">
              {/* Mobile Menu Button */}
              <div className="lg:hidden flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">Learning Hub</h1>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  {sidebarOpen ? (
                    <X size={24} className="text-slate-300" />
                  ) : (
                    <Menu size={24} className="text-slate-300" />
                  )}
                </motion.button>
              </div>

              {/* Sidebar for desktop */}
              <div className="hidden lg:block mb-6">
                <h1 className="text-3xl font-bold text-white mb-6">
                  Learning Hub
                </h1>
              </div>

              {/* Progress Indicator */}
              <Card variant="elevated" padding="lg" className="bg-slate-800/50">
                <ProgressIndicator
                  currentStep={currentStep}
                  totalSteps={SECTION_CONFIG.length}
                />
              </Card>

              {/* Breadcrumb Navigation */}
              <Card variant="default" padding="md" className="bg-slate-800/30">
                <BreadcrumbNav
                  sections={SECTION_CONFIG}
                  currentSection={currentSection}
                  onNavigate={handleNavigateSection}
                  disabledSections={disabledSections}
                />
              </Card>

              {/* Main Content Area */}
              <div ref={mainContentRef} className="space-y-6 scroll-mt-8">
                <AnimatePresence mode="wait">
                  {/* Input Section */}
                  {currentSection === "input" && (
                    <SectionWrapper
                      key="input-section"
                      title="Step 1: Learning Resource"
                      description="Paste a URL or select from resources to get started"
                      icon={<BookOpen size={24} />}
                      showPrevious={false}
                      showNext={false}
                      isLoading={inputLoading}
                      error={inputError}
                    >
                      <InputSection
                        onGenerateNotes={handleGenerateNotes}
                        onGenerateQuiz={handleGenerateQuiz}
                        isLoading={inputLoading || notesLoading || quizLoading}
                        disabled={false}
                      />
                    </SectionWrapper>
                  )}

                  {/* Notes Section */}
                  {currentSection === "notes" && (
                    <SectionWrapper
                      key="notes-section"
                      title="Step 2: Generated Notes"
                      description="Review and study the generated notes from your resource"
                      icon={<CheckCircle size={24} />}
                      onPrevious={handlePreviousSection}
                      onNext={() => {
                        handleGenerateQuiz();
                      }}
                      nextLabel="Generate Quiz"
                      showPrevious={true}
                      showNext={true}
                      isLoading={notesLoading}
                      error={notesError}
                    >
                      {notes && (
                        <ImprovedNotesView content={notes} title={url} />
                      )}
                    </SectionWrapper>
                  )}

                  {/* Quiz Section */}
                  {currentSection === "quiz" && (
                    <SectionWrapper
                      key="quiz-section"
                      title="Step 3: Quiz Challenge"
                      description={`Question ${quizState.currentIndex + 1} of ${quizState.questions.length}`}
                      icon={<HelpCircle size={24} />}
                      onPrevious={handlePreviousSection}
                      onNext={undefined}
                      showPrevious={true}
                      showNext={false}
                      isLoading={quizLoading}
                      error={quizError}
                    >
                      {quizState.questions.length > 0 && (
                        <QuizView
                          questions={quizState.questions}
                          currentQuestionIndex={quizState.currentIndex}
                          selectedAnswers={quizState.answers}
                          onAnswerSelect={handleAnswerSelect}
                          onNext={handleNextQuestion}
                          onPrevious={handlePreviousQuestion}
                          onSubmit={handleSubmitQuiz}
                          isLoading={resultsLoading}
                          showExplanation={false}
                        />
                      )}
                    </SectionWrapper>
                  )}

                  {/* Results Section */}
                  {currentSection === "results" && resultsState && (
                    <SectionWrapper
                      key="results-section"
                      title="Step 4: Quiz Results & Analysis"
                      description="Review your performance and identified weak areas"
                      icon={<Trophy size={24} />}
                      onPrevious={handlePreviousSection}
                      onNext={undefined}
                      showPrevious={true}
                      showNext={false}
                      isLoading={resultsLoading}
                      error={resultsError}
                    >
                      <div className="space-y-8">
                        {/* Results View */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <ResultsView
                            score={resultsState.score}
                            totalQuestions={resultsState.totalQuestions}
                            results={resultsState.results}
                            timestamp={resultsState.timestamp}
                            onRetakeQuiz={handleRetakeQuiz}
                            onViewWeakAreas={() => {}}
                            isLoading={resultsLoading}
                          />
                        </motion.div>

                        {/* Weak Areas Analysis */}
                        {resultsState.weakTopics.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-6"
                          >
                            <div className="border-t border-slate-700/50 pt-6">
                              <WeakAreasAnalysis
                                topics={resultsState.weakTopics}
                                isLoading={resultsLoading}
                              />
                            </div>

                            {/* Recommendations */}
                            {resultsState.recommendations.length > 0 && (
                              <div className="border-t border-slate-700/50 pt-6">
                                <RecommendationsCard
                                  recommendations={resultsState.recommendations}
                                  title="Recommended Resources"
                                  subtitle="Based on your weak areas, here are resources to help you improve"
                                  isLoading={resultsLoading}
                                />
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </SectionWrapper>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Close sidebar on mobile when clicking outside */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 z-30 bg-black/50"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImprovedMainLayout;
