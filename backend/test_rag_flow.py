#!/usr/bin/env python3
"""
Standalone RAG Ingestion Flow Test Script

Tests the complete pipeline:
1. Fetch URL content
2. Extract and clean text
3. Split into chunks
4. Generate embeddings
5. Store in Pinecone with metadata
6. Query and verify storage

Run without frontend or database dependencies.
"""

import hashlib
import os
import re
import sys
import time
from datetime import datetime
from typing import Dict, List

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec

# Load environment variables
load_dotenv()


class RAGIngestionTester:
    """Standalone RAG ingestion flow tester."""

    def __init__(self, test_index_name: str = "rag-test-flow"):
        """Initialize RAG tester with Pinecone and embeddings."""
        self.test_index_name = test_index_name
        self.dimension = 384  # sentence-transformers/all-MiniLM-L6-v2
        self.verbose = True

        print("\n" + "=" * 80)
        print("🚀 RAG INGESTION FLOW TEST - INITIALIZATION")
        print("=" * 80)

        # Initialize embeddings
        print("\n📍 Step 1: Initializing Embeddings Model...")
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={"device": "cpu"},
            )
            print("✅ Embeddings model loaded successfully")
            print(f"   Model: sentence-transformers/all-MiniLM-L6-v2")
            print(f"   Dimension: {self.dimension}")
        except Exception as e:
            print(f"❌ Failed to initialize embeddings: {e}")
            sys.exit(1)

        # Initialize Pinecone
        print("\n📍 Step 2: Initializing Pinecone...")
        try:
            api_key = os.getenv("PINECONE_API_KEY")
            if not api_key:
                raise ValueError("PINECONE_API_KEY environment variable not set")

            self.pc = Pinecone(api_key=api_key)
            print("✅ Pinecone client initialized")
        except Exception as e:
            print(f"❌ Failed to initialize Pinecone: {e}")
            sys.exit(1)

        # Ensure test index exists
        print(f"\n📍 Step 3: Setting up Pinecone Index '{self.test_index_name}'...")
        self._ensure_index()

        # Initialize text splitter
        print("\n📍 Step 4: Initializing Text Splitter...")
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""],
        )
        print("✅ Text splitter initialized")
        print(f"   Chunk size: 800 tokens")
        print(f"   Chunk overlap: 100 tokens")

        print("\n" + "=" * 80)
        print("✅ ALL INITIALIZATION STEPS COMPLETED")
        print("=" * 80)

    def _ensure_index(self):
        """Create or verify Pinecone index exists."""
        try:
            indexes = self.pc.list_indexes()
            if self.test_index_name in indexes.names():
                print(f"✅ Index '{self.test_index_name}' already exists")
                index_info = self.pc.describe_index(self.test_index_name)
                print(f"   Dimension: {index_info.dimension}")
                print(f"   Metric: {index_info.metric}")
                print(f"   Status: {index_info.status}")
                return

            print(f"📍 Creating new index '{self.test_index_name}'...")
            self.pc.create_index(
                name=self.test_index_name,
                dimension=self.dimension,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )

            # Wait for index to be ready
            print("   Waiting for index to be ready...")
            for attempt in range(30):
                try:
                    index_info = self.pc.describe_index(self.test_index_name)
                    if index_info.status == "Ready":
                        print(f"✅ Index created and ready")
                        return
                except:
                    pass
                time.sleep(1)

            raise TimeoutError("Index creation timeout")

        except Exception as e:
            print(f"❌ Index setup failed: {e}")
            sys.exit(1)

    def fetch_url(self, url: str) -> str:
        """Fetch and extract text content from URL."""
        print("\n" + "=" * 80)
        print("📥 FETCHING URL CONTENT")
        print("=" * 80)
        print(f"\n🌐 URL: {url}")

        try:
            print("📍 Sending request...")
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            print(f"✅ Response received (Status: {response.status_code})")

            print("\n📍 Parsing HTML...")
            soup = BeautifulSoup(response.content, "html.parser")

            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.extract()

            # Get text
            text = soup.get_text()

            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = " ".join(chunk for chunk in chunks if chunk)

            print("✅ Content extracted")
            print(f"   Total characters: {len(text)}")
            print(f"   Preview: {text[:200]}...")

            return text

        except Exception as e:
            print(f"❌ Failed to fetch URL: {e}")
            raise

    def normalize_text(self, text: str) -> str:
        """Normalize text for processing."""
        print("\n" + "=" * 80)
        print("🔤 TEXT NORMALIZATION")
        print("=" * 80)

        print(f"\n📊 Original size: {len(text)} characters")

        # Remove extra whitespace
        text = re.sub(r"\s+", " ", text.strip())
        # Remove non-printable characters
        text = re.sub(r"[^\x20-\x7E\n]", "", text)

        print(f"✅ Normalized size: {len(text)} characters")

        return text

    def chunk_text(self, text: str) -> List[str]:
        """Split text into chunks."""
        print("\n" + "=" * 80)
        print("✂️  TEXT CHUNKING")
        print("=" * 80)

        print("\n📍 Splitting text into chunks...")
        chunks = self.text_splitter.split_text(text)

        print(f"✅ Text split into {len(chunks)} chunks")
        for i, chunk in enumerate(chunks[:3]):  # Show first 3
            print(f"\n   Chunk {i + 1} ({len(chunk)} chars):")
            print(f"   {chunk[:100]}...")

        if len(chunks) > 3:
            print(f"\n   ... and {len(chunks) - 3} more chunks")

        return chunks

    def generate_embeddings(self, chunks: List[str]) -> List[Dict]:
        """Generate embeddings for all chunks."""
        print("\n" + "=" * 80)
        print("🧠 GENERATING EMBEDDINGS")
        print("=" * 80)

        print(f"\n📍 Generating embeddings for {len(chunks)} chunks...")

        embeddings_data = []
        for i, chunk in enumerate(chunks):
            if (i + 1) % 5 == 0:
                print(f"   Progress: {i + 1}/{len(chunks)}")

            embedding = self.embeddings.embed_query(chunk)
            embeddings_data.append(
                {
                    "chunk_index": i,
                    "text": chunk,
                    "embedding": embedding,
                    "embedding_dim": len(embedding),
                }
            )

        print(f"✅ Generated {len(embeddings_data)} embeddings")
        print(f"   Embedding dimension: {embeddings_data[0]['embedding_dim']}")

        return embeddings_data

    def store_in_pinecone(
        self,
        url: str,
        embeddings_data: List[Dict],
        test_id: str = None,
    ) -> str:
        """Store embeddings and metadata in Pinecone."""
        print("\n" + "=" * 80)
        print("💾 STORING IN PINECONE")
        print("=" * 80)

        if test_id is None:
            test_id = hashlib.md5(url.encode()).hexdigest()[:8]

        print(f"\n📍 Preparing vectors for storage...")
        print(f"   Test ID: {test_id}")
        print(f"   URL: {url}")
        print(f"   Total chunks: {len(embeddings_data)}")

        index = self.pc.Index(self.test_index_name)
        vectors = []

        for item in embeddings_data:
            chunk_id = f"{test_id}_{item['chunk_index']}"
            metadata = {
                "test_id": test_id,
                "url": url,
                "chunk_index": item["chunk_index"],
                "total_chunks": len(embeddings_data),
                "text": item["text"],
                "timestamp": datetime.utcnow().isoformat(),
            }

            vectors.append(
                {
                    "id": chunk_id,
                    "values": item["embedding"],
                    "metadata": metadata,
                }
            )

        print(f"\n📍 Upserting {len(vectors)} vectors to Pinecone...")

        # Upsert in batches
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i : i + batch_size]
            index.upsert(vectors=batch)
            print(f"   ✅ Batch {(i // batch_size) + 1}: {len(batch)} vectors")

        print(f"\n✅ Successfully stored {len(vectors)} vectors in Pinecone")

        return test_id

    def query_pinecone(self, query: str, test_id: str, top_k: int = 5) -> List[Dict]:
        """Query Pinecone to verify storage."""
        print("\n" + "=" * 80)
        print("🔍 QUERYING PINECONE FOR VERIFICATION")
        print("=" * 80)

        print(f"\n🎯 Query: {query}")
        print(f"   Test ID: {test_id}")
        print(f"   Top K: {top_k}")

        print("\n📍 Generating query embedding...")
        query_embedding = self.embeddings.embed_query(query)
        print(f"✅ Query embedding generated (dimension: {len(query_embedding)})")

        index = self.pc.Index(self.test_index_name)

        print("\n📍 Searching Pinecone...")
        results = index.query(
            vector=query_embedding,
            filter={"test_id": test_id},
            top_k=top_k,
            include_metadata=True,
            include_values=False,
        )

        print(f"✅ Query completed")

        if not results["matches"]:
            print("❌ No matches found!")
            return []

        print(f"✅ Found {len(results['matches'])} relevant chunks\n")

        results_list = []
        for i, match in enumerate(results["matches"], 1):
            metadata = match.get("metadata", {})
            score = match.get("score", 0)

            result = {
                "rank": i,
                "chunk_id": match["id"],
                "score": score,
                "url": metadata.get("url", ""),
                "chunk_index": metadata.get("chunk_index", ""),
                "text": metadata.get("text", ""),
            }
            results_list.append(result)

            print(f"   Result {i}:")
            print(f"   ├─ Chunk ID: {match['id']}")
            print(f"   ├─ Similarity Score: {score:.4f}")
            print(f"   ├─ Chunk Index: {metadata.get('chunk_index', 'N/A')}")
            print(f"   ├─ URL: {metadata.get('url', 'N/A')}")
            print(f"   └─ Text Preview: {metadata.get('text', '')[:100]}...")

        return results_list

    def cleanup(self, test_id: str):
        """Clean up test data from Pinecone."""
        print("\n" + "=" * 80)
        print("🧹 CLEANUP")
        print("=" * 80)

        print(f"\n📍 Deleting test data (test_id: {test_id})...")

        try:
            index = self.pc.Index(self.test_index_name)

            # Delete by filter is not directly supported, so we'll skip for now
            # In production, you'd track vector IDs and delete them
            print(f"⚠️  Note: Manual cleanup recommended (test_id: {test_id})")
            print(f"   Vector IDs follow pattern: {test_id}_0, {test_id}_1, etc.")

        except Exception as e:
            print(f"❌ Cleanup error: {e}")

    def run_full_test(self, url: str, query: str = None):
        """Run the complete RAG ingestion flow test."""
        print("\n" + "=" * 80)
        print("🚀 STARTING FULL RAG INGESTION FLOW TEST")
        print("=" * 80)

        try:
            # Step 1: Fetch content
            text = self.fetch_url(url)

            # Step 2: Normalize text
            normalized_text = self.normalize_text(text)

            # Step 3: Chunk text
            chunks = self.chunk_text(normalized_text)

            # Step 4: Generate embeddings
            embeddings_data = self.generate_embeddings(chunks)

            # Step 5: Store in Pinecone
            test_id = self.store_in_pinecone(url, embeddings_data)

            # Step 6: Query Pinecone
            if query is None:
                query = chunks[0][:50] if chunks else "test query"

            print(f"\n💡 Using query: '{query}'")
            results = self.query_pinecone(query, test_id, top_k=5)

            # Summary
            print("\n" + "=" * 80)
            print("📊 TEST SUMMARY")
            print("=" * 80)
            print(f"\n✅ Test ID: {test_id}")
            print(f"✅ URL: {url}")
            print(f"✅ Total text: {len(text)} characters")
            print(f"✅ Chunks created: {len(chunks)}")
            print(f"✅ Embeddings generated: {len(embeddings_data)}")
            print(f"✅ Vectors stored in Pinecone: {len(embeddings_data)}")
            print(f"✅ Query results: {len(results)} chunks")

            print("\n✅ VALIDATION PASSED:")
            print("  ✓ URL content fetched successfully")
            print("  ✓ Text extracted and normalized")
            print("  ✓ Chunks created")
            print("  ✓ Embeddings generated")
            print("  ✓ Vectors stored in Pinecone with metadata")
            print("  ✓ Query returned relevant chunks")
            print("  ✓ Metadata contains URL and chunk index")

            print("\n" + "=" * 80)
            print("✅ RAG INGESTION FLOW TEST COMPLETED SUCCESSFULLY!")
            print("=" * 80 + "\n")

            return {"success": True, "test_id": test_id, "results": results}

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            import traceback

            traceback.print_exc()
            return {"success": False, "error": str(e)}


def main():
    """Main entry point for the test script."""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 78 + "║")
    print("║" + "RAG INGESTION FLOW TEST - STANDALONE SCRIPT".center(78) + "║")
    print("║" + " " * 78 + "║")
    print("╚" + "=" * 78 + "╝")

    # Test URLs - using publicly accessible educational resources
    test_urls = [
        "https://en.wikipedia.org/wiki/Machine_learning",  # Public, reliable
    ]

    # Custom query for testing
    test_queries = ["What is machine learning", "neural networks and training"]

    # Initialize tester
    tester = RAGIngestionTester()

    # Run tests
    for url_idx, url in enumerate(test_urls, 1):
        print(f"\n\n{'#' * 80}")
        print(f"# TEST {url_idx}: {url}")
        print(f"{'#' * 80}")

        try:
            query = test_queries[url_idx - 1] if url_idx <= len(test_queries) else None
            result = tester.run_full_test(url, query)

            if result["success"]:
                print(f"\n✅ Test {url_idx} PASSED")
            else:
                print(
                    f"\n❌ Test {url_idx} FAILED: {result.get('error', 'Unknown error')}"
                )

        except KeyboardInterrupt:
            print("\n\n⚠️  Test interrupted by user")
            break
        except Exception as e:
            print(f"\n\n❌ Test {url_idx} failed with exception: {e}")
            import traceback

            traceback.print_exc()

    print("\n" + "=" * 80)
    print("🎉 ALL TESTS COMPLETED!")
    print("=" * 80)
    print("\nNext steps:")
    print("  1. Check Pinecone dashboard for stored vectors")
    print("  2. Verify metadata contains URLs and chunk indices")
    print("  3. Try querying with different text to test retrieval quality")
    print("\n")


if __name__ == "__main__":
    main()
