// Components - Header
export { Header } from "./Header";
export type { default as HeaderComponent } from "./Header";

// Examples (for documentation/showcase purposes)
export {
  BasicHeaderExample,
  CustomNavHeaderExample,
  BreadcrumbHeaderExample,
  ThemeToggleHeaderExample,
  FullFeaturedHeaderExample,
  MobileOptimizedHeaderExample,
  DynamicBadgeHeaderExample,
  CompletePageSetupExample,
} from "./Header.examples";

// Re-export UI components
export { Button } from "./ui/Button";
export {
  default as Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/Card";
export { Alert } from "./ui/Alert";
export { Badge } from "./ui/Badge";
export { default as Input } from "./ui/Input";
export { Modal } from "./ui/Modal";
export { Toast } from "./ui/Toast";
export { Loader } from "./ui/Loader";

// Quiz and Results Components
export { QuizView } from "./QuizView";
export type { QuizQuestion, QuizViewProps } from "./QuizView";

export { ResultsView } from "./ResultsView";
export type { QuestionResult, ResultsViewProps } from "./ResultsView";

export { WeakAreasAnalysis } from "./WeakAreasAnalysis";
export type { WeakTopic, WeakAreasAnalysisProps } from "./WeakAreasAnalysis";

export { RecommendationsCard } from "./RecommendationsCard";
export type {
  ResourceType,
  Recommendation,
  RecommendationsCardProps,
} from "./RecommendationsCard";

// Improved UI Components
export { InputSection } from "./InputSection";
export type { InputSectionProps, SuggestedResource } from "./InputSection";

export { ImprovedNotesView } from "./ImprovedNotesView";
export type { ImprovedNotesViewProps } from "./ImprovedNotesView";

// Main Layout Component
export { ImprovedMainLayout } from "./ImprovedMainLayout";
export type { ImprovedMainLayoutProps } from "./ImprovedMainLayout";
