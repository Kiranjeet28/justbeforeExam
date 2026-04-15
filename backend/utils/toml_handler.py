"""TOMLHandler: Utility for TOML serialization and format conversion."""

import json
import logging
from typing import Any, Dict, Union

try:
    import toml

    TOML_AVAILABLE = True
except ImportError:
    TOML_AVAILABLE = False

logger = logging.getLogger(__name__)


class TOMLHandler:
    """Handles TOML serialization/deserialization and conversion."""

    @staticmethod
    def dict_to_toml_string(data: Dict[str, Any]) -> str:
        """Convert Python dict to TOML string.

        Args:
            data: Dictionary to convert

        Returns:
            TOML formatted string

        Raises:
            ImportError: If toml package is not installed
        """
        if not TOML_AVAILABLE:
            raise ImportError(
                "toml package not installed. Install with: pip install toml"
            )

        try:
            return toml.dumps(data)
        except Exception as e:
            logger.error(f"Failed to convert dict to TOML: {e}")
            raise

    @staticmethod
    def toml_string_to_dict(toml_string: str) -> Dict[str, Any]:
        """Convert TOML string to Python dict.

        Args:
            toml_string: TOML formatted string

        Returns:
            Parsed dictionary

        Raises:
            ImportError: If toml package is not installed
        """
        if not TOML_AVAILABLE:
            raise ImportError(
                "toml package not installed. Install with: pip install toml"
            )

        try:
            return toml.loads(toml_string)
        except Exception as e:
            logger.error(f"Failed to parse TOML string: {e}")
            raise

    @staticmethod
    def dict_to_json_compatible(data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert dict to JSON-compatible format for API responses.

        Args:
            data: Input dictionary

        Returns:
            JSON-compatible dictionary
        """
        try:
            # Convert through JSON to ensure full compatibility
            return json.loads(json.dumps(data))
        except Exception as e:
            logger.error(f"Failed to make dict JSON-compatible: {e}")
            return data

    @staticmethod
    def json_string_to_dict(json_string: str) -> Dict[str, Any]:
        """Convert JSON string to dict.

        Args:
            json_string: JSON formatted string

        Returns:
            Parsed dictionary
        """
        try:
            return json.loads(json_string)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON string: {e}")
            raise

    @staticmethod
    def dict_to_json_string(data: Dict[str, Any], pretty: bool = False) -> str:
        """Convert dict to JSON string.

        Args:
            data: Dictionary to convert
            pretty: Whether to format with indentation

        Returns:
            JSON formatted string
        """
        try:
            if pretty:
                return json.dumps(data, indent=2)
            return json.dumps(data)
        except Exception as e:
            logger.error(f"Failed to convert dict to JSON: {e}")
            raise

    @staticmethod
    def convert_between_formats(
        data: Union[str, Dict[str, Any]],
        source_format: str,
        target_format: str,
    ) -> Union[str, Dict[str, Any]]:
        """Convert data between JSON and TOML formats.

        Args:
            data: Input data (string or dict)
            source_format: Source format ("json", "toml", or "dict")
            target_format: Target format ("json", "toml", or "dict")

        Returns:
            Converted data in target format

        Raises:
            ValueError: If format is unsupported
        """
        source_format = source_format.lower()
        target_format = target_format.lower()

        # Parse to dict first
        if source_format == "dict":
            data_dict = data if isinstance(data, dict) else {}
        elif source_format == "json":
            if isinstance(data, str):
                data_dict = TOMLHandler.json_string_to_dict(data)
            else:
                data_dict = data
        elif source_format == "toml":
            if isinstance(data, str):
                data_dict = TOMLHandler.toml_string_to_dict(data)
            else:
                data_dict = data
        else:
            raise ValueError(f"Unsupported source format: {source_format}")

        # Convert to target format
        if target_format == "dict":
            return data_dict
        elif target_format == "json":
            return TOMLHandler.dict_to_json_string(data_dict)
        elif target_format == "toml":
            return TOMLHandler.dict_to_toml_string(data_dict)
        else:
            raise ValueError(f"Unsupported target format: {target_format}")

    @staticmethod
    def flatten_dict(
        data: Dict[str, Any], parent_key: str = "", sep: str = "."
    ) -> Dict[str, Any]:
        """Flatten nested dictionary for TOML compatibility.

        Args:
            data: Nested dictionary
            parent_key: Parent key prefix
            sep: Separator for nested keys

        Returns:
            Flattened dictionary
        """
        items = []
        for k, v in data.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k

            if isinstance(v, dict):
                items.extend(TOMLHandler.flatten_dict(v, new_key, sep=sep).items())
            elif isinstance(v, list):
                items.append((new_key, v))
            else:
                items.append((new_key, v))

        return dict(items)

    @staticmethod
    def unflatten_dict(data: Dict[str, Any], sep: str = ".") -> Dict[str, Any]:
        """Unflatten dictionary from flat structure.

        Args:
            data: Flattened dictionary
            sep: Separator for nested keys

        Returns:
            Nested dictionary
        """
        result = {}

        for key, value in data.items():
            parts = key.split(sep)
            current = result

            for part in parts[:-1]:
                if part not in current:
                    current[part] = {}
                current = current[part]

            current[parts[-1]] = value

        return result

    @staticmethod
    def merge_dicts(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
        """Deep merge override dictionary into base dictionary.

        Args:
            base: Base dictionary
            override: Override dictionary

        Returns:
            Merged dictionary
        """
        result = base.copy()

        for key, value in override.items():
            if (
                key in result
                and isinstance(result[key], dict)
                and isinstance(value, dict)
            ):
                result[key] = TOMLHandler.merge_dicts(result[key], value)
            else:
                result[key] = value

        return result

    @staticmethod
    def is_toml_available() -> bool:
        """Check if TOML library is available.

        Returns:
            True if toml package is installed
        """
        return TOML_AVAILABLE

    @staticmethod
    def get_format_info() -> Dict[str, Any]:
        """Get information about available formats.

        Returns:
            Dictionary with format support information
        """
        return {
            "json_available": True,
            "toml_available": TOML_AVAILABLE,
            "supported_formats": ["json", "dict", "toml"]
            if TOML_AVAILABLE
            else ["json", "dict"],
        }
