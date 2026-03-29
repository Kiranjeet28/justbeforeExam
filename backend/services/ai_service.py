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


{chunks_text}

Based on the study materials above, generate comprehensive study notes with the following structure:

## 📚 Key Concepts

## 💡 Detailed Explanations

## 🎯 Summary

Please format the response in clean Markdown."""

# New: Use model_dispatch for artifact generation
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from model_dispatch import generateArtifacts

class HuggingFaceRAG:
    """Hugging Face RAG implementation using MiniMaxAI/MiniMax-M2.5 and Qwen/Qwen2.5-7B-Instruct"""
    def __init__(self):
        pass

    def generate_artifacts(self, noteText: str):
        """Generate Mind Map JSON and Cheat Sheet Markdown using new models"""
        return generateArtifacts(noteText)


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
                        print(f"Primary model ({model_name}) rate limited, trying fallback...")
                        continue  # Try next model
                    # If fallback also failed, use development mock response
                    print(f"Fallback model ({model_name}) also rate limited, using mock response for development")
                    return self._get_mock_response(prompt)
                
                # Check for quota exceeded
                if "quota" in error_str or "exceeded" in error_str:
                    if model_name == self.primary_model:
                        print(f"Primary model ({model_name}) quota exceeded, trying fallback...")
                        continue  # Try fallback model
                    # Use mock response as last resort
                    print(f"Fallback model ({model_name}) quota exceeded, using mock response for development")
                    return self._get_mock_response(prompt)
                
                # For other errors, try fallback if not already on it
                if model_name == self.primary_model:
                    print(f"Primary model ({model_name}) error: {str(e)}, trying fallback...")
                    continue
                # If fallback also failed with a different error, use mock
                print(f"Fallback model failed with error: {str(e)}, using mock response for development")
                return self._get_mock_response(prompt)
        
        # Final fallback to mock response
        return self._get_mock_response(prompt)
    
    def _get_mock_response(self, prompt: str) -> str:
        """Generate a mock response for development when API is rate limited"""
        # Generate contextual mock response based on prompt type
        if "study notes" in prompt.lower() or "key concepts" in prompt.lower():
            return """## 📚 Key Concepts

### Core Fundamentals
- **Concept 1**: This represents the foundational understanding required for deeper learning
- **Concept 2**: Building upon the first concept, this introduces more complexity
- **Concept 3**: Advanced application of the previous concepts

## 💡 Main Concepts

### Understanding the Material
The study materials present interconnected ideas that form a cohesive framework for learning. Each concept builds upon previous knowledge and should be studied in sequence.

### Practical Applications
- Real-world examples demonstrate how these concepts apply
- Understanding the "why" behind each concept strengthens retention
- Connecting concepts to existing knowledge improves comprehension

## 📌 Essential Definitions

**Term 1**: A concise definition focusing on the key aspects and importance
**Term 2**: Clear explanation of how this term relates to the broader subject
**Term 3**: Practical definition that helps with real-world application

## 🧠 Conceptual Connections

- **Relationships**: These concepts interconnect through shared principles
- **Prerequisites**: Understanding foundational concepts enables learning of advanced topics
- **Causal Links**: Some concepts directly cause or enable understanding of others

## ⚠️ Common Pitfalls

1. **Misconception 1**: Students often misunderstand by overlooking the connection to prerequisite knowledge
2. **Misconception 2**: Confusion arises from similar terminology used in different contexts
3. **Misconception 3**: Lack of practical examples leads to abstract thinking errors

---

*Note: Mock response generated due to API rate limiting. Please wait 60 seconds and try again, or upgrade your API quota.*
"""
        else:
            return """## Study Report Summary

Based on the provided materials, here's a comprehensive analysis:

### Key Findings
- **Main Topic**: The materials focus on fundamental concepts and their applications
- **Complexity Level**: Intermediate to advanced material requiring careful study
- **Interconnections**: Topics are interconnected and build upon each other

### Recommended Study Approach
1. Start with foundational concepts
2. Understand relationships between ideas
3. Practice applications with real examples
4. Review common pitfalls and misconceptions

### Assessment Areas
- Conceptual understanding
- Practical application
- Critical thinking and analysis
- Connection between topics

---

*Note: Mock response generated due to API rate limiting. Please wait 60 seconds and try again, or upgrade your API quota.*
"""

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
        Generate comprehensive study notes using Hugging Face RAG only.
        Falls back to mock response for development if API is unavailable.
        
        Args:
            source_texts: List of text content from sources
            topic: Optional topic/focus for the notes
        
        Returns:
            Dict with 'notes' (markdown) and 'sources_count'
        """
        if not source_texts:
            raise ValueError("source_texts cannot be empty")
        
        # Combine all texts and chunk them
        combined_text = " ".join(source_texts)
        
        # Use new artifact generation logic
        try:
            rag = HuggingFaceRAG()
            artifacts = rag.generate_artifacts(combined_text)
            return {
                "mind_map_json": artifacts["mind_map_json"],
                "cheat_sheet_md": artifacts["cheat_sheet_md"],
                "sources_count": len(source_texts),
                "provider": "huggingface-new"
            }
        except Exception as e:
            print(f"HuggingFace artifact error: {str(e)}")
            print("Falling back to mock response for development")
            return {
                "mind_map_json": {},
                "cheat_sheet_md": "",
                "sources_count": len(source_texts),
                "provider": "huggingface-mock"
            }
    
    def _generate_mock_notes(self, content: str, topic: str = "") -> str:
        """Generate mock study notes from content for development/fallback"""
        # Extract key words from content for more relevant mock notes
        words = content.split()[:50]  # Get first 50 words
        key_phrase = " ".join(words[:10]) if words else "study material"
        
        topic_section = f"**Focus**: {topic}\n\n" if topic else ""
        
        return f"""# Study Notes

{topic_section}## 📚 Key Concepts

Based on the provided materials, here are the fundamental concepts:

### Core Understanding
- **Primary Concept**: {key_phrase}... and related foundational ideas that form the basis of this material
- **Secondary Concepts**: Building upon the primary concept, these develop deeper understanding
- **Advanced Ideas**: More complex applications and extensions of the core material

## 💡 Main Ideas

### Foundational Principles
The study material emphasizes several interconnected principles:

1. **Principle 1**: Essential understanding of the core topic and its relevance
2. **Principle 2**: How concepts relate to broader frameworks and systems
3. **Principle 3**: Practical applications and real-world implementations

### Practical Applications
- Real-world examples from the materials demonstrate practical use
- Case studies show how concepts apply in different contexts
- Hands-on applications reinforce theoretical knowledge

## 📌 Key Definitions

**Core Term 1**: A foundational concept that serves as a prerequisite for understanding advanced topics in this material

**Core Term 2**: An important idea that connects multiple concepts and demonstrates their relationships

**Core Term 3**: A practical application or tool used to implement the theoretical concepts discussed

**Supporting Term 4**: A related concept that provides additional context and understanding

**Supporting Term 5**: A technical or specialized term used in this field of study

## 🧠 How Concepts Connect

- **Hierarchical Relationships**: Some concepts build directly upon others, forming a learning progression
- **Lateral Connections**: Concepts at similar complexity levels relate to and reinforce each other
- **Causal Chains**: Understanding how one concept leads to or causes understanding of another
- **Systems Thinking**: Viewing the concepts as part of larger, interconnected systems

## ⚠️ Common Misconceptions

1. **Myth 1**: A common misunderstanding is that concepts are isolated - they are actually deeply interconnected
2. **Myth 2**: Students often focus on memorization rather than understanding the underlying principles
3. **Myth 3**: The material may seem abstract until connected to real-world examples and applications
4. **Myth 4**: Skipping foundational concepts leads to confusion in advanced topics
5. **Myth 5**: Passive reading without active engagement doesn't create lasting understanding

## ✅ Study Strategy

1. **Start with Foundations**: Ensure you understand basic concepts before moving to advanced topics
2. **Active Learning**: Engage with the material through problems, discussions, and applications
3. **Make Connections**: Continuously link new concepts to previously learned material
4. **Review Regularly**: Spaced repetition helps cement understanding and long-term retention
5. **Test Yourself**: Regular practice and self-assessment improve retention and identify gaps

---

*Note: This is a development response. For production use, please configure a valid Hugging Face API token.*
"""
