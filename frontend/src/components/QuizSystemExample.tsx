/**
 * Example: Complete Quiz + Results + Analysis System
 *
 * This example demonstrates how to use all 4 new components together:
 * - QuizView: Display quiz questions
 * - ResultsView: Show quiz results
 * - WeakAreasAnalysis: Analyze weak topics
 * - RecommendationsCard: Suggest resources
 */

import { useState } from "react";
import {
  QuizView,
  ResultsView,
  WeakAreasAnalysis,
  RecommendationsCard,
  type QuizQuestion,
  type QuestionResult,
  type WeakTopic,
  type Recommendation,
} from "@/components";

type ViewState = "quiz" | "results" | "weak-areas" | "recommendations";

export function QuizSystemExample() {
  // Quiz State
  const [currentView, setCurrentView] = useState<ViewState>("quiz");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample quiz questions
  const quizQuestions: QuizQuestion[] = [
    {
      id: "q1",
      question: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correctAnswer: "Paris",
      explanation:
        "Paris has been the capital of France since the 12th century and is located in the north-central part of France.",
      topic: "Geography",
    },
    {
      id: "q2",
      question: "Which planet is closest to the Sun?",
      options: ["Venus", "Mercury", "Earth", "Mars"],
      correctAnswer: "Mercury",
      explanation:
        "Mercury is the smallest planet and closest to the Sun in our solar system, orbiting at an average distance of about 57.9 million kilometers.",
      topic: "Astronomy",
    },
    {
      id: "q3",
      question: "What is the chemical symbol for Gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correctAnswer: "Au",
      explanation:
        "The chemical symbol for gold comes from its Latin name 'aurum'. Gold has an atomic number of 79.",
      topic: "Chemistry",
    },
  ];

  // Sample quiz results
  const quizResults: QuestionResult[] = [
    {
      questionId: "q1",
      question: "What is the capital of France?",
      userAnswer: "Paris",
      correctAnswer: "Paris",
      isCorrect: true,
      topic: "Geography",
    },
    {
      questionId: "q2",
      question: "Which planet is closest to the Sun?",
      userAnswer: "Venus",
      correctAnswer: "Mercury",
      isCorrect: false,
      explanation:
        "Mercury is the smallest planet and closest to the Sun in our solar system, orbiting at an average distance of about 57.9 million kilometers.",
      topic: "Astronomy",
    },
    {
      questionId: "q3",
      question: "What is the chemical symbol for Gold?",
      userAnswer: "Au",
      correctAnswer: "Au",
      isCorrect: true,
      topic: "Chemistry",
    },
  ];

  // Sample weak areas
  const weakAreas: WeakTopic[] = [
    {
      topicName: "Astronomy",
      correctCount: 0,
      totalCount: 1,
      suggestedActions: [
        "Review planetary positions and order from the sun",
        "Study the characteristics of each planet",
        "Complete practice quiz on solar system",
      ],
      difficulty: "intermediate",
    },
    {
      topicName: "Chemistry",
      correctCount: 1,
      totalCount: 1,
      suggestedActions: ["Great job! Keep practicing with more complex formulas"],
      difficulty: "intermediate",
    },
    {
      topicName: "Geography",
      correctCount: 1,
      totalCount: 1,
      suggestedActions: ["Review world capitals and landmarks"],
      difficulty: "beginner",
    },
  ];

  // Sample recommendations
  const recommendations: Recommendation[] = [
    {
      id: "rec1",
      title: "Complete Solar System Guide",
      description:
        "Comprehensive guide covering all planets, moons, and celestial objects in our solar system.",
      type: "article",
      difficulty: "intermediate",
      url: "https://example.com/solar-system",
      tags: ["astronomy", "planets", "science"],
    },
    {
      id: "rec2",
      title: "Astronomy Basics Course",
      description:
        "Interactive course covering fundamental astronomy concepts with interactive models.",
      type: "course",
      difficulty: "beginner",
      duration: "4 weeks",
      instructor: "Dr. Carl Sagan Institute",
      rating: 4.8,
      url: "https://example.com/astronomy-course",
      tags: ["astronomy", "learning", "space"],
    },
    {
      id: "rec3",
      title: "Practice Astronomy Quiz",
      description: "20-question quiz to test your knowledge of the solar system.",
      type: "practice",
      difficulty: "intermediate",
      duration: "15 mins",
      url: "https://example.com/astronomy-quiz",
      tags: ["astronomy", "quiz", "practice"],
    },
    {
      id: "rec4",
      title: "Space Explorer - Documentary",
      description:
        "Award-winning documentary about planetary exploration and discoveries.",
      type: "video",
      difficulty: "beginner",
      duration: "1h 30m",
      instructor: "Space Channel",
      rating: 4.9,
      url: "https://example.com/space-documentary",
      tags: ["astronomy", "documentary", "video"],
    },
  ];

  const totalQuestions = quizQuestions.length;
  const correctAnswers = quizResults.filter((r) => r.isCorrect).length;

  // Handlers
  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsLoading(true);
    // Simulate API call to submit quiz
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setCurrentView("results");
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setCurrentView("quiz");
  };

  const handleViewWeakAreas = () => {
    setCurrentView("weak-areas");
  };

  const handleStudyTopic = (topicName: string) => {
    console.log("Studying topic:", topicName);
    setCurrentView("recommendations");
  };

  const handleGetResources = (topicName: string) => {
    console.log("Getting resources for:", topicName);
    setCurrentView("recommendations");
  };

  const handleResourceClick = (recommendation: Recommendation) => {
    console.log("Resource clicked:", recommendation);
    // Could track analytics here
  };

  // Render current view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-100 mb-2">Quiz System</h1>
          <p className="text-slate-400">
            Complete the quiz, analyze your results, and get personalized
            recommendations.
          </p>
        </div>

        {/* Breadcrumb */}
        <div className="flex gap-2 mb-8 text-sm text-slate-400">
          <button
            onClick={() => setCurrentView("quiz")}
            className={`px-3 py-1 rounded ${
              currentView === "quiz"
                ? "bg-violet-500/20 text-violet-300"
                : "hover:text-slate-300"
            }`}
          >
            Quiz
          </button>
          <span>→</span>
          <button
            onClick={() => setCurrentView("results")}
            className={`px-3 py-1 rounded ${
              currentView === "results"
                ? "bg-violet-500/20 text-violet-300"
                : "hover:text-slate-300"
            }`}
          >
            Results
          </button>
          <span>→</span>
          <button
            onClick={() => setCurrentView("weak-areas")}
            className={`px-3 py-1 rounded ${
              currentView === "weak-areas"
                ? "bg-violet-500/20 text-violet-300"
                : "hover:text-slate-300"
            }`}
          >
            Weak Areas
          </button>
          <span>→</span>
          <button
            onClick={() => setCurrentView("recommendations")}
            className={`px-3 py-1 rounded ${
              currentView === "recommendations"
                ? "bg-violet-500/20 text-violet-300"
                : "hover:text-slate-300"
            }`}
          >
            Resources
          </button>
        </div>

        {/* Content */}
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          {/* Quiz View */}
          {currentView === "quiz" && (
            <QuizView
              questions={quizQuestions}
              currentQuestionIndex={currentQuestionIndex}
              selectedAnswers={selectedAnswers}
              onAnswerSelect={handleAnswerSelect}
              onNext={handleNextQuestion}
              onPrevious={handlePreviousQuestion}
              onSubmit={handleSubmitQuiz}
              isLoading={isLoading}
              error={error}
              showExplanation={false}
            />
          )}

          {/* Results View */}
          {currentView === "results" && (
            <ResultsView
              score={correctAnswers}
              totalQuestions={totalQuestions}
              results={quizResults}
              timestamp={new Date()}
              onRetakeQuiz={handleRetakeQuiz}
              onViewWeakAreas={handleViewWeakAreas}
              isLoading={isLoading}
            />
          )}

          {/* Weak Areas Analysis */}
          {currentView === "weak-areas" && (
            <WeakAreasAnalysis
              topics={weakAreas}
              onStudyTopic={handleStudyTopic}
              onGetResources={handleGetResources}
              isLoading={isLoading}
            />
          )}

          {/* Recommendations */}
          {currentView === "recommendations" && (
            <RecommendationsCard
              recommendations={recommendations}
              title="Recommended Resources for Astronomy"
              subtitle="Based on your weak areas, here are curated resources to help you improve"
              onResourceClick={handleResourceClick}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-slate-800/20 border border-slate-700/30 rounded-lg">
          <p className="text-sm text-slate-400">
            💡 <strong>Tip:</strong> Use the breadcrumb navigation above to move between
            different sections of the quiz system.
          </p>
        </div>
      </div>
    </div>
  );
}

export default QuizSystemExample;
