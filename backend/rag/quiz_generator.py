"""RAG-based Quiz Generator using vector store from database sources."""

import json
from typing import Dict, List

from database import SessionLocal
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from models import Quiz

from rag.llm import get_completion
from rag.tools import initialize_vector_store_from_db


class QuizGenerator:
    """Generates quizzes using RAG from database sources."""

    def __init__(self):
        """Initialize the quiz generator."""
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
        )
        self.vector_store = initialize_vector_store_from_db()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""],
        )

    def generate_quiz(self, input_text: str) -> Dict:
        """
        Generate a quiz from the input topic or notes.

        Args:
            input_text: Topic or notes string

        Returns:
            Quiz dictionary with mcqs, short_questions, source_mapping
        """
        # Step 1: Retrieval
        retrieved_chunks = self._retrieve_relevant_chunks(input_text)

        # Step 2: Context Build
        context = self._build_context(input_text, retrieved_chunks)

        # Step 3: Quiz Generation
        quiz_data = self._generate_quiz_with_llm(context)

        # Step 4: Source Linking
        source_mapping = self._create_source_mapping(quiz_data, retrieved_chunks)

        return {
            "mcqs": quiz_data.get("mcqs", []),
            "short_questions": quiz_data.get("short_questions", []),
            "source_mapping": source_mapping,
        }

    def _retrieve_relevant_chunks(self, query: str) -> List[Document]:
        """Retrieve relevant chunks from vector store."""
        # Query vector store for top 5-10 chunks
        retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 8},  # Get 8 chunks
        )

        results = retriever.invoke(query)
        return results

    def _build_context(self, input_text: str, retrieved_chunks: List[Document]) -> str:
        """Build concise context from input and retrieved chunks."""
        # Combine input and retrieved texts
        texts = [input_text]

        for chunk in retrieved_chunks:
            texts.append(chunk.page_content)

        # Remove duplicates and keep concise
        unique_texts = []
        seen = set()

        for text in texts:
            # Simple deduplication by checking if text is substring of seen
            is_duplicate = False
            for seen_text in seen:
                if text in seen_text or seen_text in text:
                    is_duplicate = True
                    break
            if not is_duplicate:
                unique_texts.append(text)
                seen.add(text)

        # Limit total context length
        context = "\n\n".join(unique_texts)
        if len(context) > 8000:  # Keep under 8000 chars for LLM
            context = context[:8000] + "..."

        return context

    def _generate_quiz_with_llm(self, context: str) -> Dict:
        """Generate quiz using LLM."""
        prompt = f"""
Based on the following context, generate a quiz with multiple-choice questions (MCQs) and short-answer questions.

Context:
{context}

Requirements:
- Generate 5-10 MCQs
- Generate 2-3 short-answer questions
- Each question must target key concepts from the context
- Questions should be clear and exam-focused
- No vague or ambiguous questions
- No duplication of questions
- Focus on important concepts only

MCQ Format (JSON array):
[
  {{
    "question": "What is the capital of France?",
    "options": ["A) London", "B) Paris", "C) Berlin", "D) Madrid"],
    "correct_answer": "B",
    "explanation": "Paris is the capital and largest city of France."
  }}
]

Short Answer Format (JSON array):
[
  {{
    "question": "Explain the concept of inheritance in OOP.",
    "expected_answer": "Inheritance allows a class to inherit properties and methods from another class.",
    "key_points": ["Parent class", "Child class", "Method overriding", "Code reuse"]
  }}
]

Return only valid JSON with keys "mcqs" and "short_questions".
"""

        response = get_completion(prompt)
        if response["status"] != "success":
            raise Exception(
                f"LLM call failed: {response.get('reason', 'Unknown error')}"
            )

        try:
            quiz_data = json.loads(response["content"])
            return quiz_data
        except json.JSONDecodeError:
            # Fallback: try to extract JSON from response
            content = response["content"]
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end != -1:
                json_str = content[start:end]
                return json.loads(json_str)
            else:
                raise Exception("Failed to parse LLM response as JSON")

    def _create_source_mapping(
        self, quiz_data: Dict, retrieved_chunks: List[Document]
    ) -> Dict:
        """Create mapping of questions to source chunks."""
        mapping = {}

        # For simplicity, map all questions to all retrieved chunks
        # In a more advanced implementation, we could use embeddings to match questions to chunks
        source_refs = []
        for i, chunk in enumerate(retrieved_chunks):
            source_ref = {
                "chunk_id": f"chunk_{i}",
                "source_id": chunk.metadata.get("source_id"),
                "url": chunk.metadata.get("url"),
                "text_preview": chunk.page_content[:200] + "...",
            }
            source_refs.append(source_ref)

        # Map each question to sources
        question_index = 0
        for mcq in quiz_data.get("mcqs", []):
            mapping[f"mcq_{question_index}"] = source_refs
            question_index += 1

        for sa in quiz_data.get("short_questions", []):
            mapping[f"sa_{question_index}"] = source_refs
            question_index += 1

        return mapping

    def save_quiz(self, topic: str, quiz_data: Dict) -> Quiz:
        """Save the generated quiz to database."""
        db = SessionLocal()
        try:
            quiz = Quiz(
                topic=topic,
                questions=json.dumps(
                    {
                        "mcqs": quiz_data["mcqs"],
                        "short_questions": quiz_data["short_questions"],
                    }
                ),
                source_refs=json.dumps(quiz_data["source_mapping"]),
            )
            db.add(quiz)
            db.commit()
            db.refresh(quiz)
            return quiz
        finally:
            db.close()


# Global instance
_quiz_generator = None


def get_quiz_generator() -> QuizGenerator:
    """Get or create the global quiz generator instance."""
    global _quiz_generator
    if _quiz_generator is None:
        _quiz_generator = QuizGenerator()
    return _quiz_generator


def generate_quiz(input_text: str) -> Dict:
    """Convenience function to generate a quiz."""
    generator = get_quiz_generator()
    return generator.generate_quiz(input_text)


def save_quiz(topic: str, quiz_data: Dict) -> Quiz:
    """Convenience function to save a quiz."""
    generator = get_quiz_generator()
    return generator.save_quiz(topic, quiz_data)
