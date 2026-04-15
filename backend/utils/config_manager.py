"""ConfigManager: Centralized TOML configuration management."""

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

try:
    import tomllib
except ModuleNotFoundError:
    try:
        import tomli as tomllib
    except ImportError:
        tomllib = None

logger = logging.getLogger(__name__)


class ConfigManager:
    """Manages TOML configuration files for the pipeline."""

    # Default config file locations
    CONFIG_DIR = Path(__file__).parent.parent / "pipeline" / "config"
    MODELS_CONFIG_FILE = CONFIG_DIR / "models.toml"
    PIPELINE_CONFIG_FILE = CONFIG_DIR / "pipeline.toml"

    # Cache for loaded configs
    _configs_cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def _get_toml_loader(cls):
        """Get TOML loader library."""
        if tomllib is None:
            raise ImportError(
                "TOML library not available. Install with: pip install toml or tomli"
            )
        return tomllib

    @classmethod
    def get_config_path(cls, filename: str) -> Path:
        """Get the full path to a config file.

        Args:
            filename: Name of the config file (e.g., 'models.toml')

        Returns:
            Path to the config file
        """
        # Check for environment variable override
        env_var = f"CONFIG_{filename.upper().replace('.', '_').replace('-', '_')}"
        custom_path = os.getenv(env_var)

        if custom_path:
            return Path(custom_path)

        return cls.CONFIG_DIR / filename

    @classmethod
    def load_toml(cls, file_path: Path) -> Dict[str, Any]:
        """Load and cache a TOML configuration file.

        Args:
            file_path: Path to the TOML file

        Returns:
            Dictionary containing the loaded configuration

        Raises:
            FileNotFoundError: If the config file doesn't exist
            Exception: If the TOML file is malformed
        """
        cache_key = str(file_path)

        # Return cached config if available
        if cache_key in cls._configs_cache:
            logger.debug(f"Using cached config from {file_path}")
            return cls._configs_cache[cache_key]

        if not file_path.exists():
            logger.warning(f"Config file not found: {file_path}")
            return {}

        try:
            loader = cls._get_toml_loader()

            with open(file_path, "rb") as f:
                config = loader.load(f)
                cls._configs_cache[cache_key] = config
                logger.info(f"Loaded config from {file_path}")
                return config
        except Exception as e:
            logger.error(f"Error loading config from {file_path}: {e}")
            raise

    @classmethod
    def get_models_config(cls) -> Dict[str, Any]:
        """Get models configuration from TOML.

        Returns:
            Dictionary with model configurations
        """
        config_path = cls.get_config_path("models.toml")
        try:
            config = cls.load_toml(config_path)
            return config
        except Exception as e:
            logger.error(f"Failed to load models config: {e}")
            return {}

    @classmethod
    def get_pipeline_config(cls) -> Dict[str, Any]:
        """Get pipeline configuration from TOML.

        Returns:
            Dictionary with pipeline configurations
        """
        config_path = cls.get_config_path("pipeline.toml")
        try:
            config = cls.load_toml(config_path)
            return config.get("pipeline", {})
        except Exception as e:
            logger.error(f"Failed to load pipeline config: {e}")
            return {}

    @classmethod
    def get_input_config(cls) -> Dict[str, Any]:
        """Get input processing configuration.

        Returns:
            Dictionary with input settings
        """
        config_path = cls.get_config_path("pipeline.toml")
        try:
            config = cls.load_toml(config_path)
            return config.get("input", {})
        except Exception as e:
            logger.error(f"Failed to load input config: {e}")
            return {}

    @classmethod
    def get_output_config(cls) -> Dict[str, Any]:
        """Get output formatting configuration.

        Returns:
            Dictionary with output settings
        """
        config_path = cls.get_config_path("pipeline.toml")
        try:
            config = cls.load_toml(config_path)
            return config.get("output", {})
        except Exception as e:
            logger.error(f"Failed to load output config: {e}")
            return {}

    @classmethod
    def get_model_config(cls, model_name: str) -> Dict[str, Any]:
        """Get configuration for a specific model.

        Args:
            model_name: Name of the model (e.g., 'groq', 'gemini')

        Returns:
            Dictionary with the model's configuration
        """
        models_config = cls.get_models_config()
        return models_config.get(model_name, {})

    @classmethod
    def get_timeout_config(cls) -> Dict[str, int]:
        """Get timeout configurations.

        Returns:
            Dictionary with timeout values in seconds
        """
        config_path = cls.get_config_path("pipeline.toml")
        try:
            config = cls.load_toml(config_path)
            timeouts = config.get("pipeline", {}).get("timeouts", {})
            return timeouts
        except Exception as e:
            logger.error(f"Failed to load timeout config: {e}")
            return {}

    @classmethod
    def get_timeout(cls, operation: str, default: int = 60) -> int:
        """Get timeout for a specific operation.

        Args:
            operation: Operation name (e.g., 'note_generation')
            default: Default timeout in seconds

        Returns:
            Timeout value in seconds
        """
        timeouts = cls.get_timeout_config()
        return timeouts.get(operation, default)

    @classmethod
    def get_postprocessing_config(cls) -> Dict[str, Any]:
        """Get post-processing configuration.

        Returns:
            Dictionary with postprocessing settings
        """
        config_path = cls.get_config_path("pipeline.toml")
        try:
            config = cls.load_toml(config_path)
            return config.get("postprocessing", {})
        except Exception as e:
            logger.error(f"Failed to load postprocessing config: {e}")
            return {}

    @classmethod
    def get_artifacts_config(cls) -> Dict[str, Any]:
        """Get artifact generation configuration.

        Returns:
            Dictionary with artifact settings
        """
        config_path = cls.get_config_path("pipeline.toml")
        try:
            config = cls.load_toml(config_path)
            return config.get("pipeline", {}).get("artifacts", {})
        except Exception as e:
            logger.error(f"Failed to load artifacts config: {e}")
            return {}

    @classmethod
    def get_huggingface_config(cls) -> Dict[str, Any]:
        """Get HuggingFace model configurations.

        Returns:
            Dictionary with HuggingFace settings
        """
        models_config = cls.get_models_config()
        return models_config.get("huggingface", {})

    @classmethod
    def clear_cache(cls):
        """Clear the configuration cache."""
        cls._configs_cache.clear()
        logger.info("Configuration cache cleared")

    @classmethod
    def reload_config(cls, filename: str) -> Dict[str, Any]:
        """Force reload a configuration file.

        Args:
            filename: Name of the config file

        Returns:
            The reloaded configuration
        """
        config_path = cls.get_config_path(filename)
        cache_key = str(config_path)

        # Remove from cache to force reload
        if cache_key in cls._configs_cache:
            del cls._configs_cache[cache_key]
            logger.info(f"Cleared cache for {filename}")

        return cls.load_toml(config_path)

    @classmethod
    def get_config_value(cls, config_name: str, *keys: str) -> Any:
        """Get a nested config value.

        Args:
            config_name: Name of config file ('pipeline' or 'models')
            *keys: Nested keys to traverse

        Returns:
            Config value at the specified path, or None if not found
        """
        if config_name == "pipeline":
            config = cls.get_pipeline_config()
        elif config_name == "models":
            config = cls.get_models_config()
        else:
            return None

        for key in keys:
            if isinstance(config, dict):
                config = config.get(key)
            else:
                return None

        return config

    @classmethod
    def validate_config(cls) -> bool:
        """Validate that all required configuration files exist and are valid.

        Returns:
            True if all configs are valid, False otherwise
        """
        try:
            pipeline_config = cls.get_pipeline_config()
            if not pipeline_config:
                logger.warning("Pipeline config is empty or missing")
                return False

            models_config = cls.get_models_config()
            if not models_config:
                logger.warning("Models config is empty or missing")
                return False

            logger.info("All configuration files validated successfully")
            return True
        except Exception as e:
            logger.error(f"Configuration validation failed: {e}")
            return False

    @classmethod
    def print_config_summary(cls):
        """Print a summary of loaded configurations."""
        pipeline_config = cls.get_pipeline_config()
        models_config = cls.get_models_config()

        print("\n=== Pipeline Configuration ===")
        print(f"Format: {pipeline_config.get('format', 'json')}")
        print(f"Include Metadata: {pipeline_config.get('include_metadata', True)}")
        print(f"Enable Streaming: {pipeline_config.get('enable_streaming', True)}")
        print(f"Primary Model: {pipeline_config.get('primary_model', 'unknown')}")

        print("\n=== Models Configuration ===")
        for model_name in models_config:
            model_config = models_config[model_name]
            if isinstance(model_config, dict) and "model_name" in model_config:
                print(f"{model_name}: {model_config.get('model_name', 'unknown')}")
