# RAG Flow Test Configuration Template
#
# Copy this file, customize it, and use it to run tests with different parameters.
# Usage: python test_rag_flow.py --config rag_config.yml

import json
from typing import List, Optional


class RAGTestConfig:
    """Configuration for RAG flow tests."""

    def __init__(self):
        self.test_cases: List[dict] = []
        self.pinecone_index_name = "rag-test-flow"
        self.embedding_model = "sentence-transformers/all-MiniLM-L6-v2"
        self.chunk_size = 800
        self.chunk_overlap = 100
        self.top_k = 5
        self.batch_size = 100

    @staticmethod
    def create_default() -> "RAGTestConfig":
        """Create default configuration."""
        config = RAGTestConfig()

        # Default test case
        config.test_cases = [
            {
                "name": "Machine Learning",
                "url": "https://en.wikipedia.org/wiki/Machine_learning",
                "query": "What is machine learning and neural networks?",
                "enabled": True,
            }
        ]

        return config

    @staticmethod
    def create_comprehensive() -> "RAGTestConfig":
        """Create comprehensive test configuration with multiple URLs."""
        config = RAGTestConfig()

        config.test_cases = [
            {
                "name": "Machine Learning",
                "url": "https://en.wikipedia.org/wiki/Machine_learning",
                "query": "What is machine learning?",
                "enabled": True,
            },
            {
                "name": "Python Programming",
                "url": "https://en.wikipedia.org/wiki/Python_(programming_language)",
                "query": "What are Python's features?",
                "enabled": True,
            },
            {
                "name": "Data Science",
                "url": "https://en.wikipedia.org/wiki/Data_science",
                "query": "What is data science?",
                "enabled": True,
            },
            {
                "name": "Artificial Intelligence",
                "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
                "query": "What is artificial intelligence?",
                "enabled": True,
            },
            {
                "name": "Deep Learning",
                "url": "https://en.wikipedia.org/wiki/Deep_learning",
                "query": "How do deep neural networks work?",
                "enabled": False,  # Disabled by default
            },
        ]

        return config

    @staticmethod
    def create_small_chunks() -> "RAGTestConfig":
        """Configuration with smaller chunks for more granular testing."""
        config = RAGTestConfig.create_default()
        config.chunk_size = 400
        config.chunk_overlap = 50
        config.pinecone_index_name = "rag-test-small-chunks"
        return config

    @staticmethod
    def create_large_chunks() -> "RAGTestConfig":
        """Configuration with larger chunks for broader context."""
        config = RAGTestConfig.create_default()
        config.chunk_size = 1500
        config.chunk_overlap = 200
        config.pinecone_index_name = "rag-test-large-chunks"
        return config

    @staticmethod
    def create_high_quality_embeddings() -> "RAGTestConfig":
        """Configuration with higher quality embedding model."""
        config = RAGTestConfig.create_default()
        config.embedding_model = "sentence-transformers/all-mpnet-base-v2"
        config.pinecone_index_name = "rag-test-mpnet"
        # Note: This model has 768 dimensions instead of 384
        # You'll need to create a new index with dimension 768
        return config

    def to_dict(self) -> dict:
        """Convert configuration to dictionary."""
        return {
            "test_cases": self.test_cases,
            "pinecone_index_name": self.pinecone_index_name,
            "embedding_model": self.embedding_model,
            "chunk_size": self.chunk_size,
            "chunk_overlap": self.chunk_overlap,
            "top_k": self.top_k,
            "batch_size": self.batch_size,
        }

    def to_json(self) -> str:
        """Convert configuration to JSON string."""
        return json.dumps(self.to_dict(), indent=2)

    def save_to_file(self, filename: str):
        """Save configuration to JSON file."""
        with open(filename, "w") as f:
            f.write(self.to_json())
        print(f"✅ Configuration saved to {filename}")

    @staticmethod
    def load_from_file(filename: str) -> "RAGTestConfig":
        """Load configuration from JSON file."""
        with open(filename, "r") as f:
            data = json.load(f)

        config = RAGTestConfig()
        config.test_cases = data.get("test_cases", [])
        config.pinecone_index_name = data.get("pinecone_index_name", "rag-test-flow")
        config.embedding_model = data.get(
            "embedding_model", "sentence-transformers/all-MiniLM-L6-v2"
        )
        config.chunk_size = data.get("chunk_size", 800)
        config.chunk_overlap = data.get("chunk_overlap", 100)
        config.top_k = data.get("top_k", 5)
        config.batch_size = data.get("batch_size", 100)

        print(f"✅ Configuration loaded from {filename}")
        return config


# Example usage and preset configurations
if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("RAG FLOW TEST - CONFIGURATION TEMPLATES")
    print("=" * 80)

    # Example 1: Save default configuration
    print("\n1. Default Configuration:")
    default_config = RAGTestConfig.create_default()
    default_config.save_to_file("rag_config_default.json")

    # Example 2: Save comprehensive configuration
    print("\n2. Comprehensive Configuration:")
    comprehensive_config = RAGTestConfig.create_comprehensive()
    comprehensive_config.save_to_file("rag_config_comprehensive.json")

    # Example 3: Save small chunks configuration
    print("\n3. Small Chunks Configuration:")
    small_config = RAGTestConfig.create_small_chunks()
    small_config.save_to_file("rag_config_small_chunks.json")

    # Example 4: Save large chunks configuration
    print("\n4. Large Chunks Configuration:")
    large_config = RAGTestConfig.create_large_chunks()
    large_config.save_to_file("rag_config_large_chunks.json")

    # Example 5: Display a configuration
    print("\n5. Example Configuration (JSON):")
    print(default_config.to_json())

    # Example 6: Create custom configuration
    print("\n6. Custom Configuration:")
    custom_config = RAGTestConfig()
    custom_config.test_cases = [
        {
            "name": "Custom Test",
            "url": "https://example.com",
            "query": "your query here",
            "enabled": True,
        }
    ]
    custom_config.chunk_size = 1000
    custom_config.top_k = 10
    custom_config.save_to_file("rag_config_custom.json")

    # Example 7: Load configuration
    print("\n7. Loading configuration:")
    loaded_config = RAGTestConfig.load_from_file("rag_config_default.json")
    print(f"   Loaded {len(loaded_config.test_cases)} test cases")
    print(f"   Index name: {loaded_config.pinecone_index_name}")
    print(f"   Chunk size: {loaded_config.chunk_size}")

    print("\n" + "=" * 80)
    print("✅ Configuration templates created successfully!")
    print("=" * 80)
    print("\nYou can now use these configurations like:")
    print("  config = RAGTestConfig.load_from_file('rag_config_comprehensive.json')")
    print("\n")
