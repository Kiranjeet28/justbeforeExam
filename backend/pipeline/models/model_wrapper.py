"""Model Wrapper: Modular interface for all LLM calls in the pipeline with TOML config support."""

import logging
import os
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

import requests
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from rag.llm import SmartLLMSwitcher

try:
    from utils.config_manager import ConfigManager

    CONFIG_AVAILABLE = True
except ImportError:
    CONFIG_AVAILABLE = False

logger = logging.getLogger(__name__)


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
    """Groq LLM wrapper with TOML config support."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize Groq model with optional config.

        Args:
            config: Dictionary with keys: model_name, temperature, max_tokens
        """
        self.config = config or {}

        # Get API key from environment
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set in environment")

        # Load model parameters from config with defaults
        model_name = self.config.get("model_name", "llama-3.3-70b-versatile")
        temperature = self.config.get("temperature", 0.7)
        max_tokens = self.config.get("max_tokens", 4096)

        self.model = ChatGroq(
            model=model_name,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
        )

        logger.info(
            f"Initialized Groq model: {model_name} "
            f"(temp={temperature}, max_tokens={max_tokens})"
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
            logger.error(f"Groq generation error: {str(e)}")
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
    """Gemini LLM wrapper with TOML config support."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize Gemini model with optional config.

        Args:
            config: Dictionary with keys: model_name, temperature, max_tokens
        """
        self.config = config or {}

        # Get API key from environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")

        # Load model parameters from config with defaults
        model_name = self.config.get("model_name", "gemini-1.5-flash")
        temperature = self.config.get("temperature", 0.7)
        max_tokens = self.config.get("max_tokens", 4096)

        self.model = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            max_output_tokens=max_tokens,
            api_key=api_key,
        )

        logger.info(
            f"Initialized Gemini model: {model_name} "
            f"(temp={temperature}, max_tokens={max_tokens})"
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
            logger.error(f"Gemini generation error: {str(e)}")
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
    """OpenAI LLM wrapper with TOML config support."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize OpenAI model with optional config.

        Args:
            config: Dictionary with keys: model_name, temperature, max_tokens, base_url
        """
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError(
                "openai is not installed. Install it with: pip install openai"
            )

        self.config = config or {}

        # Get API key from environment
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in environment")

        self.model_name = self.config.get("model_name", "gpt-4")

        self.client = OpenAI(api_key=api_key)

        # Optional: Support custom API base
        base_url = self.config.get("base_url") or os.getenv("OPENAI_BASE_URL")
        if base_url:
            self.client.base_url = base_url

        logger.info(f"Initialized OpenAI model: {self.model_name}")

    def generate(self, prompt: str, **kwargs) -> Dict[str, Any]:
        try:
            temperature = self.config.get("temperature", 0.7)
            max_tokens = self.config.get("max_tokens", 4096)

            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return {
                "content": response.choices[0].message.content,
                "model": self.name,
                "status": "success",
            }
        except Exception as e:
            logger.error(f"OpenAI generation error: {str(e)}")
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
    """HuggingFace Inference API wrapper with TOML config support."""

    def __init__(self, model_name: str, config: Optional[Dict[str, Any]] = None):
        """Initialize HuggingFace model.

        Args:
            model_name: HuggingFace model identifier
            config: Dictionary with keys: timeout
        """
        self.model_name = model_name
        self.config = config or {}

        # Get API key from environment
        api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not api_key:
            raise ValueError("HUGGINGFACE_API_KEY not set in environment")

        self.headers = {"Authorization": f"Bearer {api_key}"}
        self.url = f"https://api-inference.huggingface.co/models/{model_name}"
        self.timeout = self.config.get("timeout", 120)

        logger.info(f"Initialized HuggingFace model: {model_name}")

    def generate(self, prompt: str, **kwargs) -> Dict[str, Any]:
        try:
            response = requests.post(
                self.url,
                headers=self.headers,
                json={"inputs": prompt},
                timeout=self.timeout,
            )
            response.raise_for_status()

            result = response.json()
            content = (
                result["generated_text"] if "generated_text" in result else str(result)
            )

            return {"content": content, "model": self.name, "status": "success"}
        except Exception as e:
            logger.error(f"HuggingFace generation error: {str(e)}")
            return {
                "content": None,
                "model": self.name,
                "status": "error",
                "error": str(e),
            }

    @property
    def name(self) -> str:
        return f"huggingface-{self.model_name.split('/')[-1].lower()}"


class SmartLLMModel(BaseModel):
    """Smart LLM switcher (Groq + Gemini fallback) with config support."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize SmartLLM with optional config."""
        self.config = config or {}
        self.switcher = SmartLLMSwitcher()
        logger.info("Initialized SmartLLM model")

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
    """Get or create the global model registry with TOML config support."""
    global _registry
    if _registry is None:
        _registry = ModelRegistry()

        # Load configs from TOML if available
        models_config = {}
        if CONFIG_AVAILABLE:
            try:
                models_config = ConfigManager.get_models_config()
                logger.info("Loaded models config from TOML")
            except Exception as e:
                logger.warning(f"Failed to load models config from TOML: {e}")

        # Register Groq model
        try:
            groq_cfg = models_config.get("groq", {})
            _registry.register("groq", GroqModel(groq_cfg))
            logger.info("Registered Groq model")
        except ValueError as e:
            logger.warning(f"Could not register Groq model: {e}")
        except Exception as e:
            logger.error(f"Unexpected error registering Groq model: {e}")

        # Register Gemini model
        try:
            gemini_cfg = models_config.get("gemini", {})
            _registry.register("gemini", GeminiModel(gemini_cfg))
            logger.info("Registered Gemini model")
        except ValueError as e:
            logger.warning(f"Could not register Gemini model: {e}")
        except Exception as e:
            logger.error(f"Unexpected error registering Gemini model: {e}")

        # Register OpenAI model
        try:
            openai_cfg = models_config.get("openai", {})
            _registry.register("openai", OpenAIModel(openai_cfg))
            logger.info("Registered OpenAI model")
        except ValueError as e:
            logger.warning(f"Could not register OpenAI model: {e}")
        except Exception as e:
            logger.error(f"Unexpected error registering OpenAI model: {e}")

        # Register Smart LLM
        try:
            smart_cfg = models_config.get("smart_llm", {})
            _registry.register("smart-llm", SmartLLMModel(smart_cfg))
            logger.info("Registered SmartLLM model")
        except ValueError as e:
            logger.warning(f"Could not register SmartLLM model: {e}")
        except Exception as e:
            logger.error(f"Unexpected error registering SmartLLM model: {e}")

        # Register HuggingFace models
        try:
            hf_cfg = models_config.get("huggingface", {})

            # Register specific HuggingFace models
            if "minimax" in hf_cfg:
                minimax_model_id = hf_cfg["minimax"].get("model_id")
                if minimax_model_id:
                    _registry.register(
                        "minimax", HuggingFaceModel(minimax_model_id, hf_cfg)
                    )
                    logger.info("Registered HuggingFace Minimax model")

            if "qwen" in hf_cfg:
                qwen_model_id = hf_cfg["qwen"].get("model_id")
                if qwen_model_id:
                    _registry.register("qwen", HuggingFaceModel(qwen_model_id, hf_cfg))
                    logger.info("Registered HuggingFace Qwen model")

            if "mathstral" in hf_cfg:
                mathstral_model_id = hf_cfg["mathstral"].get("model_id")
                if mathstral_model_id:
                    _registry.register(
                        "mathstral", HuggingFaceModel(mathstral_model_id, hf_cfg)
                    )
                    logger.info("Registered HuggingFace Mathstral model")

        except Exception as e:
            logger.debug(f"No HuggingFace models configured: {e}")

    return _registry
