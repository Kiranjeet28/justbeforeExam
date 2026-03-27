"""
Modular AI Service with Provider Pattern
Supports Gemini (default) and OpenAI-compatible providers (e.g., Groq)
Includes error handling, exponential backoff, and model fallback
Also supports Hugging Face Inference API with RAG capabilities
"""

import os
import json
import time
import re
from abc import ABC, abstractmethod
from typing import Optional
from collections import Counter

import requests
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

load_dotenv()


class RateLimitExceeded(Exception):
    """Custom exception for rate limit errors (429)"""
    pass


class HuggingFaceRAG:
    """Hugging Face RAG implementation using Mistral model"""
    
    def __init__(self):
        self.api_token = os.getenv("HUGGINGFACE_API_TOKEN")
        if not self.api_token:
            raise ValueError("HUGGINGFACE_API_TOKEN environment variable is not set")
        
        self.model_id = "mistralai/Mistral-7B-Instruct-v0.3"
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_id}"
        self.headers = {"Authorization": f"Bearer {self.api_token}"}
        self.chunk_size = 1000
    
    def _extract_keywords(self, text: str, num_keywords: int = 10) -> list[str]:
        """Extract keywords from text for RAG relevance scoring"""
        # Simple keyword extraction: filter out common words
        common_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
            'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which',
            'who', 'when', 'where', 'why', 'how'
        }
        
        # Tokenize and filter
        words = re.findall(r'\b\w+\b', text.lower())
        filtered = [w for w in words if w not in common_words and len(w) > 3]
        
        # Count word frequencies and return top keywords
        word_counts = Counter(filtered)
        return [word for word, count in word_counts.most_common(num_keywords)]
    
    def _chunk_text(self, text: str) -> list[str]:
        """Chunk text into pieces of chunk_size characters"""
        chunks = []
        for i in range(0, len(text), self.chunk_size):
            chunks.append(text[i:i + self.chunk_size])
        return chunks
    
    def _score_chunk(self, chunk: str, keywords: list[str]) -> float:
        """Score a chunk based on keyword frequency"""
        chunk_lower = chunk.lower()
        score = sum(chunk_lower.count(keyword) for keyword in keywords)
        return score
    
    def _select_relevant_chunks(self, chunks: list[str], num_chunks: int = 5) -> list[str]:
        """Select most relevant chunks based on keyword frequency"""
        if not chunks or len(chunks) <= num_chunks:
            return chunks
        
        # Extract keywords from all chunks combined
        combined_text = " ".join(chunks)
        keywords = self._extract_keywords(combined_text)
        
        # Score and sort chunks
        scored_chunks = [(chunk, self._score_chunk(chunk, keywords)) for chunk in chunks]
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        
        # Return top chunks
        return [chunk for chunk, score in scored_chunks[:num_chunks]]
    
    def _call_mistral(self, prompt: str) -> str:
        """Call Mistral API with error handling"""
        @retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=1, min=2, max=10),
            reraise=True
        )
        def make_request():
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 2000,
                    "temperature": 0.7,
                    "top_p": 0.9,
                }
            }
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
        
        try:
            result = make_request()
            # Handle both list and dict response formats
            if isinstance(result, list):
                return result[0].get('generated_text', '')
            return result.get('generated_text', '')
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                raise RateLimitExceeded(
                    "API Limit reached. Please wait 60 seconds before retrying."
                )
            raise RuntimeError(f"Hugging Face API error: {str(e)}")
        except Exception as e:
            raise RuntimeError(f"Error calling Mistral: {str(e)}")
    
    def generate_notes_from_chunks(self, chunks: list[str], topic: str = "") -> str:
        """Generate study notes from text chunks using Mistral"""
        if not chunks:
            raise ValueError("No chunks provided")
        
        # Select most relevant chunks
        relevant_chunks = self._select_relevant_chunks(chunks, num_chunks=5)
        chunks_text = "\n---\n".join(relevant_chunks)
        
        topic_hint = f"Topic: {topic}\n" if topic else ""
        prompt = f"""{topic_hint}Study Materials:
---
{chunks_text}
---

Based on the study materials above, generate comprehensive study notes with the following structure:

## 📚 Key Concepts
- List and explain the main concepts
- Use bullet points for clarity

## 💡 Detailed Explanations
- Provide deeper understanding of each concept
- Include examples where relevant

## 🎯 Summary
- Recap the most important points

Please format the response in clean Markdown."""

        return self._call_mistral(prompt)


class TextExtractor:
    """Utility for extracting text from various sources"""
    
    @staticmethod
    def extract_from_youtube(video_id: str) -> str:
        """Extract transcript from YouTube video"""
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            transcript_text = " ".join([item['text'] for item in transcript_list])
            return transcript_text
        except Exception as e:
            return f"[Could not extract YouTube transcript: {str(e)}]"
    
    @staticmethod
    def extract_from_url(url: str) -> str:
        """Extract text content from URL"""
        try:
            from bs4 import BeautifulSoup
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text
            text = soup.get_text()
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            return text
        except Exception as e:
            return f"[Could not extract URL content: {str(e)}]"


class AIProvider(ABC):
    """Base class for AI providers"""

    @abstractmethod
    def generate_study_report(self, sources_text: str) -> str:
        """
        Generate a study report from concatenated source content.
        Must return clean Markdown with:
        - 'Just Before Exam' summary
        - 'Key Terms' list
        - '3-5 Potential Exam Questions'
        """
        pass

    @abstractmethod
    def generate_study_notes(self, sources_text: str) -> str:
        """
        Generate comprehensive study notes from sources.
        Must return clean Markdown with:
        - Main Concepts (detailed explanations)
        - Essential Definitions (bold terms)
        - Conceptual Connections (how topics relate)
        - Common Pitfalls (what students get wrong)
        """
        pass

    @abstractmethod
    def generate_notes_with_rag(self, sources_data: list[dict]) -> dict:
        """
        Generate comprehensive study notes using RAG (Retrieval Augmented Generation).
        Must return a dict with:
        - 'notes': Markdown-formatted study notes
        - 'citations': List of source citations
        """
        pass


class GeminiProvider(AIProvider):
    """Google Gemini API provider (Free Tier) with error handling and fallback"""

    def __init__(self):
        try:
            import google.generativeai as genai
        except ImportError:
            raise ImportError(
                "google-generativeai is not installed. "
                "Install it with: pip install google-generativeai"
            )

        self.genai = genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")

        self.genai.configure(api_key=api_key)
        self.primary_model = "gemini-2.0-flash"
        self.fallback_model = "gemini-2.5-pro"
        self.model = self.genai.GenerativeModel(self.primary_model)

    def _call_with_fallback(self, prompt: str) -> str:
        """
        Call Gemini API with exponential backoff and model fallback.
        
        If gemini-2.0-flash fails due to quota, falls back to gemini-2.5-pro.
        Uses exponential backoff for rate limiting.
        """
        models_to_try = [self.primary_model, self.fallback_model]
        
        for model_name in models_to_try:
            try:
                model = self.genai.GenerativeModel(model_name)
                
                # Retry with exponential backoff
                @retry(
                    stop=stop_after_attempt(3),
                    wait=wait_exponential(multiplier=1, min=2, max=10),
                    reraise=True
                )
                def make_request():
                    return model.generate_content(prompt)
                
                response = make_request()
                return response.text
                
            except Exception as e:
                error_str = str(e).lower()
                
                # Check for rate limit error
                if "429" in str(e) or "resource_exhausted" in error_str or "rate limit" in error_str:
                    # If this is the primary model, try fallback
                    if model_name == self.primary_model:
                        continue  # Try next model
                    # If fallback also failed, raise RateLimitExceeded
                    raise RateLimitExceeded(
                        "API Limit reached. Please wait 60 seconds before retrying."
                    )
                
                # Check for quota exceeded
                if "quota" in error_str or "exceeded" in error_str:
                    if model_name == self.primary_model:
                        continue  # Try fallback model
                    raise RateLimitExceeded(
                        "API Limit reached. Please wait 60 seconds before retrying."
                    )
                
                # For other errors, try fallback if not already on it
                if model_name == self.primary_model:
                    continue
                # If fallback also failed with a different error, raise
                raise RuntimeError(f"Error with Gemini API: {str(e)}")
        
        raise RuntimeError("Failed to generate content with all available models")

    def generate_study_report(self, sources_text: str) -> str:
        """Generate study report using Gemini API with fallback"""
        master_prompt = self._get_master_prompt(sources_text)
        return self._call_with_fallback(master_prompt)

    def generate_study_notes(self, sources_text: str) -> str:
        """Generate comprehensive study notes using Gemini API with fallback"""
        master_prompt = self._get_study_notes_prompt(sources_text)
        return self._call_with_fallback(master_prompt)

    def generate_notes_with_rag(self, sources_data: list[dict]) -> dict:
        """
        Generate comprehensive study notes using RAG with source citations.
        Includes error handling and fallback mechanisms.
        
        Args:
            sources_data: List of dicts with 'type', 'content', 'id' keys
        
        Returns:
            Dict with 'notes' (markdown) and 'citations' (list of sources)
        
        Raises:
            RateLimitExceeded: When API rate limit is hit
            RuntimeError: For other API errors
        """
        # Build enriched context with source references
        sources_context = ""
        citations = []
        
        for idx, source in enumerate(sources_data, 1):
            source_type = source.get('type', 'note').upper()
            content = source.get('content', '')[:500]  # Limit to first 500 chars per source
            source_id = source.get('id', idx)
            
            sources_context += f"\n[SOURCE {idx}] ({source_type}) - Source ID: {source_id}\n{content}\n"
            citations.append({
                "id": source_id,
                "type": source.get('type', 'note'),
                "preview": content[:100] + "..." if len(content) > 100 else content
            })
        
        rag_prompt = f"""You are an expert academic summarizer and study guide creator. Analyze the provided study materials and extract the TOP 5 MOST COMPLEX TOPICS.

STUDY MATERIALS:
---
{sources_context}
---

For each of the 5 most complex topics, explain them using the 'Concept-Example-Analogy' framework:
1. **Concept**: Clear definition and context
2. **Example**: Concrete, practical example from the materials
3. **Analogy**: Relatable comparison to something familiar

Format your response as:

## 🧠 Complex Topic 1: [Topic Name]
**Concept**: [definition and context]
**Example**: [concrete example]
**Analogy**: [relatable comparison]

[Repeat for topics 2-5]

## 📚 Key Takeaways
[Summary of how these topics interconnect]

---

IMPORTANT:
- Return ONLY valid Markdown
- Draw all content from the provided materials
- Make explanations suitable for exam preparation
- Use proper emphasis for important terms
"""

        notes = self._call_with_fallback(rag_prompt)
        return {
            "notes": notes,
            "citations": citations,
            "sources_count": len(sources_data)
        }

    @staticmethod
    def _get_master_prompt(sources_text: str) -> str:
        """Master prompt template for study report generation"""
        return f"""You are an expert exam preparation tutor. Analyze the following study materials and generate a comprehensive study report in Markdown format.

STUDY MATERIALS:
---
{sources_text}
---

Generate a detailed study report with the following structure:

## 📚 Just Before Exam Summary
Provide a concise, high-impact summary (150-250 words) of the most critical concepts. Focus on what a student should know right before taking an exam. Make it actionable and memorable.

## 🔑 Key Terms
Create a bulleted list of 10-15 essential terms or concepts with brief 1-sentence explanations. Format: **Term**: explanation.

## ❓ Potential Exam Questions
Generate 4-5 likely exam questions based on the study materials. Include a mix of:
- Multiple choice (with 4 options)
- Short answer questions
- Essay/discussion questions

Format each question clearly with the question type indicated.

---

IMPORTANT:
- Return ONLY valid Markdown
- Use clear headers and formatting
- Be specific and draw from the provided materials
- Make content educational and exam-focused
- Avoid markdown code blocks unless showing examples
"""

    @staticmethod
    def _get_study_notes_prompt(sources_text: str) -> str:
        """Prompt template for comprehensive study notes generation"""
        return f"""You are an expert academic summarizer and study guide creator. Review the following study materials and generate comprehensive study notes in clean Markdown format.

STUDY MATERIALS:
---
{sources_text}
---

Generate structured study notes with the following sections:

## 💡 Main Concepts
Provide detailed explanations of the core concepts covered in the materials. For each concept:
- Explain what it is (clear definition)
- Explain why it matters (relevance and importance)
- Provide practical examples from the materials
- Connect to related concepts

## 📌 Essential Definitions
Create a comprehensive glossary with 15-20 key terms. Format each as:
**Term**: Clear, concise definition that's exactly 1-2 sentences

## 🧠 Conceptual Connections
Explain how the topics and concepts relate to each other:
- Which concepts build upon others?
- What are the causal relationships?
- How do different ideas form a cohesive understanding?
- What are the prerequisites for understanding each concept?

## ⚠️ Common Pitfalls
List 8-10 mistakes that students commonly make when learning these topics:
- A description of the common misconception
- Why students make this error
- The correct understanding or approach

---

IMPORTANT:
- Return ONLY valid, clean Markdown
- Use clear headers and consistent formatting
- Be comprehensive but organized
- Draw all information directly from the provided materials
- Avoid code blocks unless necessary for examples
- Make content suitable for exam preparation
- Use proper emphasis (**bold**, *italic*) for important terms
"""


class OpenAIProvider(AIProvider):
    """OpenAI-compatible API provider with error handling and retries"""

    def __init__(self):
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError(
                "openai is not installed. Install it with: pip install openai"
            )

        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

        # Optional: Support custom API base (e.g., for Groq)
        if base_url := os.getenv("OPENAI_BASE_URL"):
            self.client.base_url = base_url

    def _call_with_retry(self, messages: list[dict]) -> str:
        """
        Call OpenAI API with exponential backoff and retry logic.
        Handles rate limiting gracefully.
        """
        @retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=1, min=2, max=10),
            reraise=True
        )
        def make_request():
            return self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=3000,
            )
        
        try:
            response = make_request()
            return response.choices[0].message.content
        except Exception as e:
            error_str = str(e).lower()
            
            # Check for rate limit errors
            if "429" in str(e) or "rate_limit" in error_str or "rate limit" in error_str:
                raise RateLimitExceeded(
                    "API Limit reached. Please wait 60 seconds before retrying."
                )
            
            # Check for quota exceeded
            if "quota" in error_str or "insufficient_quota" in error_str:
                raise RateLimitExceeded(
                    "API Limit reached. Please wait 60 seconds before retrying."
                )
            
            raise RuntimeError(f"Error with OpenAI-compatible API: {str(e)}")

    def generate_study_report(self, sources_text: str) -> str:
        """Generate study report using OpenAI-compatible API with retry"""
        master_prompt = self._get_master_prompt(sources_text)
        return self._call_with_retry([{"role": "user", "content": master_prompt}])

    def generate_study_notes(self, sources_text: str) -> str:
        """Generate comprehensive study notes using OpenAI-compatible API with retry"""
        master_prompt = self._get_study_notes_prompt(sources_text)
        return self._call_with_retry([{"role": "user", "content": master_prompt}])

    def generate_notes_with_rag(self, sources_data: list[dict]) -> dict:
        """
        Generate comprehensive study notes using RAG with source citations.
        Includes error handling and retry logic.
        
        Args:
            sources_data: List of dicts with 'type', 'content', 'id' keys
        
        Returns:
            Dict with 'notes' (markdown) and 'citations' (list of sources)
        
        Raises:
            RateLimitExceeded: When API rate limit is hit
            RuntimeError: For other API errors
        """
        # Build enriched context with source references
        sources_context = ""
        citations = []
        
        for idx, source in enumerate(sources_data, 1):
            source_type = source.get('type', 'note').upper()
            content = source.get('content', '')[:500]
            source_id = source.get('id', idx)
            
            sources_context += f"\n[SOURCE {idx}] ({source_type}) - Source ID: {source_id}\n{content}\n"
            citations.append({
                "id": source_id,
                "type": source.get('type', 'note'),
                "preview": content[:100] + "..." if len(content) > 100 else content
            })
        
        rag_prompt = f"""You are an expert academic summarizer. Analyze the provided study materials and extract the TOP 5 MOST COMPLEX TOPICS.

STUDY MATERIALS:
---
{sources_context}
---

For each of the 5 most complex topics, explain using the 'Concept-Example-Analogy' framework:
1. **Concept**: Clear definition
2. **Example**: Concrete example
3. **Analogy**: Relatable comparison

Format response as:
## 🧠 Complex Topic 1: [Topic Name]
**Concept**: ...
**Example**: ...
**Analogy**: ...

[Repeat for topics 2-5]

IMPORTANT: Return only valid Markdown. Draw all content from provided materials."""

        notes = self._call_with_retry([{"role": "user", "content": rag_prompt}])
        return {
            "notes": notes,
            "citations": citations,
            "sources_count": len(sources_data)
        }

    @staticmethod
    def _get_master_prompt(sources_text: str) -> str:
        """Master prompt template for study report generation"""
        return f"""You are an expert exam preparation tutor. Analyze the following study materials and generate a comprehensive study report in Markdown format.

STUDY MATERIALS:
---
{sources_text}
---

Generate a detailed study report with the following structure:

## 📚 Just Before Exam Summary
Provide a concise, high-impact summary (150-250 words) of the most critical concepts. Focus on what a student should know right before taking an exam. Make it actionable and memorable.

## 🔑 Key Terms
Create a bulleted list of 10-15 essential terms or concepts with brief 1-sentence explanations. Format: **Term**: explanation.

## ❓ Potential Exam Questions
Generate 4-5 likely exam questions based on the study materials. Include a mix of:
- Multiple choice (with 4 options)
- Short answer questions
- Essay/discussion questions

Format each question clearly with the question type indicated.

---

IMPORTANT:
- Return ONLY valid Markdown
- Use clear headers and formatting
- Be specific and draw from the provided materials
- Make content educational and exam-focused
- Avoid markdown code blocks unless showing examples
"""

    @staticmethod
    def _get_study_notes_prompt(sources_text: str) -> str:
        """Prompt template for comprehensive study notes generation"""
        return f"""You are an expert academic summarizer and study guide creator. Review the following study materials and generate comprehensive study notes in clean Markdown format.

STUDY MATERIALS:
---
{sources_text}
---

Generate structured study notes with the following sections:

## 💡 Main Concepts
Provide detailed explanations of the core concepts covered in the materials. For each concept:
- Explain what it is (clear definition)
- Explain why it matters (relevance and importance)
- Provide practical examples from the materials
- Connect to related concepts

## 📌 Essential Definitions
Create a comprehensive glossary with 15-20 key terms. Format each as:
**Term**: Clear, concise definition that's exactly 1-2 sentences

## 🧠 Conceptual Connections
Explain how the topics and concepts relate to each other:
- Which concepts build upon others?
- What are the causal relationships?
- How do different ideas form a cohesive understanding?
- What are the prerequisites for understanding each concept?

## ⚠️ Common Pitfalls
List 8-10 mistakes that students commonly make when learning these topics:
- A description of the common misconception
- Why students make this error
- The correct understanding or approach

---

IMPORTANT:
- Return ONLY valid, clean Markdown
- Use clear headers and consistent formatting
- Be comprehensive but organized
- Draw all information directly from the provided materials
- Avoid code blocks unless necessary for examples
- Make content suitable for exam preparation
- Use proper emphasis (**bold**, *italic*) for important terms
"""


class AIService:
    """
    Modular AI Service that routes to configured provider
    Switch providers via AI_PROVIDER environment variable
    """

    def __init__(self):
        provider_name = os.getenv("AI_PROVIDER", "gemini").lower()

        if provider_name == "gemini":
            self.provider = GeminiProvider()
        elif provider_name == "openai":
            self.provider = OpenAIProvider()
        else:
            raise ValueError(
                f"Unknown AI_PROVIDER: {provider_name}. "
                "Supported providers: 'gemini', 'openai'"
            )

        self.provider_name = provider_name

    def generate_study_report(self, sources_text: str) -> str:
        """
        Generate a study report from concatenated source content.

        Args:
            sources_text: Concatenated text from all sources

        Returns:
            Markdown-formatted study report

        Raises:
            RuntimeError: If API call fails
        """
        if not sources_text or not sources_text.strip():
            raise ValueError("sources_text cannot be empty")

        return self.provider.generate_study_report(sources_text)
    def generate_study_notes(self, sources_text: str) -> str:
        """
        Generate comprehensive study notes from concatenated source content.

        Args:
            sources_text: Concatenated text from all sources

        Returns:
            Markdown-formatted study notes

        Raises:
            ValueError: If sources_text is empty
            RuntimeError: If API call fails
        """
        if not sources_text or not sources_text.strip():
            raise ValueError("sources_text cannot be empty")

        return self.provider.generate_study_notes(sources_text)

    def generate_notes_with_rag(self, sources_data: list[dict]) -> dict:
        """Generate comprehensive study notes using RAG with source citations."""
        if not sources_data:
            raise ValueError("sources_data cannot be empty")

        result = self.provider.generate_notes_with_rag(sources_data)
        result["provider"] = self.provider_name
        return result

    def generate_rag_notes(self, source_texts: list[str], topic: str = "") -> dict:
        """
        Generate comprehensive study notes using Hugging Face RAG.
        
        Args:
            source_texts: List of text content from sources
            topic: Optional topic/focus for the notes
        
        Returns:
            Dict with 'notes' (markdown) and 'sources_count'
        """
        if not source_texts:
            raise ValueError("source_texts cannot be empty")
        
        # Initialize HuggingFace RAG
        rag = HuggingFaceRAG()
        
        # Combine all texts and chunk them
        combined_text = " ".join(source_texts)
        chunks = rag._chunk_text(combined_text)
        
        # Generate notes from chunks
        notes = rag.generate_notes_from_chunks(chunks, topic=topic)
        
        return {
            "notes": notes,
            "sources_count": len(source_texts),
            "provider": "huggingface"
        }
