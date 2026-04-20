"""Quiz Answer Evaluation and Weak Area Detection."""

import json
from collections import Counter
from typing import Dict, List, Optional

from database import SessionLocal
from langchain_huggingface import HuggingFaceEmbeddings
from models import Quiz, QuizResult, User
from schemas import QuizEvaluation


class QuizEvaluator:
    """Evaluates quiz answers and detects weak areas."""

    def __init__(self):
        """Initialize evaluator with embeddings for semantic matching."""
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
        )

    def evaluate_quiz(
        self, user_id: str, quiz_id: int, user_answers: Dict[str, str]
    ) -> QuizEvaluation:
        """
        Evaluate quiz answers and detect weak areas.

        Args:
            user_id: User identifier
            quiz_id: Quiz ID
            user_answers: Dict of question_id: user_answer

        Returns:
            QuizEvaluation with score, accuracy, mistakes, weak_topics, mistake_summary
        """
        # Preprocess: validate quiz exists and has valid structure
        quiz = self._get_quiz(quiz_id)
        if not quiz:
            raise ValueError("Quiz not found")

        questions = self._parse_quiz_questions(quiz)
        if not questions:
            raise ValueError("Quiz has invalid structure")

        # Evaluate answers
        results = self._evaluate_answers(questions, user_answers)

        # Calculate score and accuracy
        score = sum(1 for r in results if r["correct"])
        total_questions = len(results)
        accuracy = (score / total_questions * 100) if total_questions > 0 else 0.0

        # Extract mistakes
        mistakes = [r for r in results if not r["correct"]]

        # Detect weak areas
        weak_topics = self._detect_weak_areas(user_id, mistakes)

        # Update user weak topics
        self._update_user_weak_topics(user_id, weak_topics)

        # Save results
        self._save_results(user_id, quiz_id, user_answers, score, accuracy, mistakes)

        # Create mistake summary
        mistake_summary = self._create_mistake_summary(mistakes)

        return QuizEvaluation(
            score=score,
            accuracy=accuracy,
            mistakes=mistakes,
            weak_topics=weak_topics,
            mistake_summary=mistake_summary,
        )

    def _get_quiz(self, quiz_id: int) -> Optional[Quiz]:
        """Get quiz from database."""
        db = SessionLocal()
        try:
            return db.query(Quiz).filter(Quiz.id == quiz_id).first()
        finally:
            db.close()

    def _parse_quiz_questions(self, quiz: Quiz) -> Dict:
        """Parse quiz questions from stored JSON."""
        try:
            return json.loads(quiz.questions)
        except (json.JSONDecodeError, KeyError):
            return {}

    def _evaluate_answers(
        self, questions: Dict, user_answers: Dict[str, str]
    ) -> List[Dict]:
        """Evaluate each answer and return detailed results."""
        results = []

        for question_id, user_answer in user_answers.items():
            if question_id not in questions:
                continue

            question_data = questions[question_id]
            question_type = "mcq" if "options" in question_data else "short_answer"

            if question_type == "mcq":
                correct = self._evaluate_mcq(question_data, user_answer)
                topic, concept = self._extract_topic_concept(
                    question_data, quiz_topic=None
                )
            else:
                correct = self._evaluate_short_answer(question_data, user_answer)
                topic, concept = self._extract_topic_concept(
                    question_data, quiz_topic=None
                )

            result = {
                "question_id": question_id,
                "correct": correct,
                "user_answer": user_answer,
                "correct_answer": question_data.get(
                    "correct_answer", question_data.get("expected_answer")
                ),
                "topic": topic,
                "concept": concept,
                "question_type": question_type,
            }
            results.append(result)

        return results

    def _evaluate_mcq(self, question_data: Dict, user_answer: str) -> bool:
        """Evaluate MCQ answer (exact match)."""
        correct_answer = question_data.get("correct_answer", "").strip().upper()
        user_answer = user_answer.strip().upper()
        return user_answer == correct_answer

    def _evaluate_short_answer(self, question_data: Dict, user_answer: str) -> bool:
        """Evaluate short answer using keyword and semantic matching."""
        expected_answer = question_data.get("expected_answer", "").lower().strip()
        user_answer = user_answer.lower().strip()

        # Exact match
        if user_answer == expected_answer:
            return True

        # Keyword matching
        key_points = [kp.lower().strip() for kp in question_data.get("key_points", [])]

        # Check if user answer contains key points
        key_matches = sum(1 for kp in key_points if kp in user_answer)
        if key_matches >= len(key_points) * 0.7:  # 70% of key points
            return True

        # Semantic similarity using embeddings
        if len(user_answer) > 10 and len(expected_answer) > 10:
            similarity = self._calculate_similarity(user_answer, expected_answer)
            if similarity > 0.8:  # High similarity threshold
                return True

        return False

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate cosine similarity between two texts."""
        try:
            emb1 = self.embeddings.embed_query(text1)
            emb2 = self.embeddings.embed_query(text2)

            # Cosine similarity
            dot_product = sum(a * b for a, b in zip(emb1, emb2))
            norm1 = sum(a * a for a in emb1) ** 0.5
            norm2 = sum(b * b for b in emb2) ** 0.5

            return dot_product / (norm1 * norm2) if norm1 and norm2 else 0.0
        except Exception:
            return 0.0

    def _extract_topic_concept(
        self, question_data: Dict, quiz_topic: Optional[str]
    ) -> tuple:
        """Extract topic and concept from question data."""
        # Try to extract from question text
        question = question_data.get("question", "").lower()

        # Simple keyword extraction for concept
        concept_keywords = {
            "list": ["list", "array", "collection"],
            "dictionary": ["dict", "dictionary", "key-value"],
            "function": ["function", "def", "method"],
            "class": ["class", "object", "inheritance"],
            "algorithm": ["sort", "search", "algorithm"],
            "database": ["sql", "query", "table"],
        }

        for concept, keywords in concept_keywords.items():
            if any(kw in question for kw in keywords):
                return quiz_topic or "General", concept.title()

        return quiz_topic or "General", "General Concept"

    def _detect_weak_areas(self, user_id: str, mistakes: List[Dict]) -> List[str]:
        """Detect weak areas based on current mistakes and historical data."""
        # Current mistakes by topic
        current_weak = [m["topic"] for m in mistakes if m["topic"] != "General"]

        # Get historical weak topics
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.user_id == user_id).first()
            historical_weak = []
            if user and user.weak_topics:
                try:
                    historical_weak = json.loads(user.weak_topics)
                except Exception:
                    historical_weak = []

            # Combine and count
            all_weak = current_weak + historical_weak
            if not all_weak:
                return []

            # Get most common topics
            topic_counts = Counter(all_weak)
            weak_topics = [
                topic for topic, count in topic_counts.most_common(3) if count > 1
            ]

            return weak_topics or current_weak[:3]  # Return current if no historical

        finally:
            db.close()

    def _update_user_weak_topics(self, user_id: str, weak_topics: List[str]):
        """Update user's weak topics in database."""
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                # Create user if doesn't exist
                user = User(user_id=user_id, weak_topics=json.dumps(weak_topics))
                db.add(user)
            else:
                # Update existing
                user.weak_topics = json.dumps(weak_topics)
            db.commit()
        finally:
            db.close()

    def _save_results(
        self,
        user_id: str,
        quiz_id: int,
        answers: Dict[str, str],
        score: int,
        accuracy: float,
        mistakes: List[Dict],
    ):
        """Save evaluation results to database."""
        db = SessionLocal()
        try:
            result = QuizResult(
                quiz_id=quiz_id,
                user_id=user_id,
                answers=json.dumps(answers),
                score=score,
                accuracy=accuracy,
                mistakes=json.dumps(mistakes),
            )
            db.add(result)
            db.commit()
        finally:
            db.close()

    def _create_mistake_summary(self, mistakes: List[Dict]) -> Dict[str, int]:
        """Create summary of mistakes by topic."""
        topics = [m["topic"] for m in mistakes]
        return dict(Counter(topics))


# Global instance
_quiz_evaluator = None


def get_quiz_evaluator() -> QuizEvaluator:
    """Get or create the global quiz evaluator instance."""
    global _quiz_evaluator
    if _quiz_evaluator is None:
        _quiz_evaluator = QuizEvaluator()
    return _quiz_evaluator


def evaluate_quiz_answers(
    user_id: str, quiz_id: int, user_answers: Dict[str, str]
) -> QuizEvaluation:
    """Convenience function to evaluate quiz answers."""
    evaluator = get_quiz_evaluator()
    return evaluator.evaluate_quiz(user_id, quiz_id, user_answers)
