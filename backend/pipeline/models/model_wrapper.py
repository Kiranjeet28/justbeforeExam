"""Model Wrapper: Modular interface for all LLM calls in the pipeline."""

import os
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

import requests
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from rag.llm import SmartLLMSwitcher
from services.artifact_service import ArtifactTransformationService


class BaseModel(ABC):
    """Abstract base class for LLM models."""

    @abstractmethod
    def generate(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """Generate response from the model."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Model name."""
        pass


class GroqModel(BaseModel):
    """Groq LLM wrapper."""

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set")

        self.model = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=4096,
            api_key=api_key,
        )

    def generate(self, prompt: str, **kwargs) -> Dict[str, Any]:
        try:
            response = self.model.invoke(prompt)
            return {
                "content": response.content,
                "model": self.name,
                "status": "success",
            }
        except Exception as e:
            return {
                "content": None,
                "model": self.name,
                "status": "error",
                "error": str(e),
            }

    @property
    def name(self) -> str:
        return "groq"


class GeminiModel(BaseModel):
    """Gemini LLM wrapper."""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")

        self.model = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0.7,
            max_output_tokens=4096,
            api_key=api_key,
        )

    def generate(self, prompt: str, **kwargs) -> Dict[str, Any]:
        try:
            response = self.model.invoke(prompt)
            return {
                "content": response.content,
                "model": self.name,
                "status": "success",
            }
        except Exception as e:
            return {
                "content": None,
                "model": self.name,
                "status": "error",
                "error": str(e),
            }

    @property
    def name(self) -> str:
        return "gemini"


class OpenAIModel(BaseModel):
    """OpenAI LLM wrapper."""

    def __init__(self):
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError(
                "openai is not installed. Install it with: pip install openai"
            )

        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-4")

        # Optional: Support custom API base (e.g., for Groq)
        if base_url := os.getenv("OPENAI_BASE_URL"):
            self.client.base_url = base_url

    def generate(self, prompt: str, **kwargs) -> Dict[str, Any]:
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=4096,
            )
            return {
                "content": response.choices[0].message.content,
                "model": self.name,
                "status": "success",
            }
        except Exception as e:
            return {
                "content": None,
                "model": self.name,
                "status": "error",
                "error": str(e),
            }

    @property
    def name(self) -> str:
        return "openai"


class HuggingFaceModel(BaseModel):
    """HuggingFace Inference API wrapper."""

    def __init__(self, model_name: str):
        self.model_name = model_name
        api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not api_key:
            raise ValueError("HUGGINGFACE_API_KEY not set")

        self.headers = {"Authorization": f"Bearer {api_key}"}
        self.url = f"https://api-inference.huggingface.co/models/{model_name}"

    def generate(self, prompt: str, **kwargs) -> Dict[str, Any]:
        try:
            response = requests.post(
                self.url, headers=self.headers, json={"inputs": prompt}, timeout=30
            )
            response.raise_for_status()

            result = response.json()
            content = (
                result["generated_text"] if "generated_text" in result else str(result)
            )

            return {"content": content, "model": self.name, "status": "success"}
        except Exception as e:
            return {
                "content": None,
                "model": self.name,
                "status": "error",
                "error": str(e),
            }

    @property
    def name(self) -> str:
        return f"huggingface-{self.model_name}"


class SmartLLMModel(BaseModel):
    """Smart LLM switcher (Groq + Gemini fallback)."""

    def __init__(self):
        self.switcher = SmartLLMSwitcher()

    def generate(self, prompt: str, **kwargs) -> Dict[str, Any]:
        result = self.switcher.get_completion(prompt)
        return {
            "content": result.get("content"),
            "model": result.get("model", "smart-llm"),
            "status": "success" if result.get("status") == "success" else "error",
            "reason": result.get("reason"),
        }

    @property
    def name(self) -> str:
        return "smart-llm"


class ArtifactModel(BaseModel):
    """Artifact generation wrapper (mind map + cheat sheet)."""

    def __init__(self):
        self.service = ArtifactTransformationService()

    def generate(self, prompt: str, **kwargs) -> Dict[str, Any]:
        try:
            result = self.service.generate_study_artifacts(prompt)
            return {
                "content": result,
                "model": self.name,
                "status": "success" if result["success"] else "error",
            }
        except Exception as e:
            return {
                "content": None,
                "model": self.name,
                "status": "error",
                "error": str(e),
            }

    @property
    def name(self) -> str:
        return "artifact"


class ModelRegistry:
    """Registry for all available models."""

    def __init__(self):
        self.models = {}

    def register(self, key: str, model: BaseModel):
        """Register a model."""
        self.models[key] = model

    def get(self, key: str) -> Optional[BaseModel]:
        """Get a model by key."""
        return self.models.get(key)

    def list_models(self) -> list[str]:
        """List all registered model keys."""
        return list(self.models.keys())


# Global registry
_registry = None


def get_model_registry() -> ModelRegistry:
    """Get or create the global model registry."""
    global _registry
    if _registry is None:
        _registry = ModelRegistry()

        # Register models
        try:
            _registry.register("groq", GroqModel())
        except ValueError:
            pass

        try:
            _registry.register("gemini", GeminiModel())
        except ValueError:
            pass

        try:
            _registry.register("openai", OpenAIModel())
        except ValueError:
            pass

        try:
            _registry.register("smart-llm", SmartLLMModel())
        except ValueError:
            pass

        try:
            _registry.register("artifact", ArtifactModel())
        except ValueError:
            pass

        # HuggingFace models
        try:
            _registry.register("minimax", HuggingFaceModel("MiniMaxAI/MiniMax-M2.5"))
            _registry.register("qwen", HuggingFaceModel("Qwen/Qwen2.5-7B-Instruct"))
        except ValueError:
            pass

    return _registry
