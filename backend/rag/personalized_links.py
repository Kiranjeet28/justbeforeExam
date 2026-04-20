"""Personalized Link Storage using Pinecone Vector Database."""

import hashlib
import json
import re
from datetime import datetime
from typing import Dict, List, Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from database import SessionLocal
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from models import LinkUsage, UserLink
from pinecone import Pinecone, ServerlessSpec

from rag.llm import get_completion


class PersonalizedLinksManager:
    """Manages personalized link storage and retrieval using Pinecone."""

    def __init__(self):
        """Initialize Pinecone client and embeddings."""
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
        )
        self.pc = Pinecone(api_key=self._get_pinecone_api_key())
        self.index_name = "personalized-links"
        self.dimension = 384  # Dimension for the embedding model
        self._ensure_index()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""],
        )
        self._topic_cache = {}  # Cache for LLM topic detection

    def _get_pinecone_api_key(self) -> str:
        """Get Pinecone API key from environment."""
        import os

        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY not set in environment")
        return api_key

    def _ensure_index(self):
        """Create Pinecone index if it doesn't exist with error handling."""
        try:
            indexes = self.pc.list_indexes()
            if self.index_name in indexes.names():
                # Verify configuration
                index_info = self.pc.describe_index(self.index_name)
                if (
                    index_info.dimension != self.dimension
                    or index_info.metric != "cosine"
                ):
                    raise ValueError(
                        f"Index {self.index_name} has incompatible configuration"
                    )
                return

            # Create with error handling
            self.pc.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )

            # Wait for readiness
            import time

            for _ in range(30):
                if self.pc.describe_index(self.index_name).status == "Ready":
                    break
                time.sleep(1)
            else:
                raise TimeoutError("Pinecone index creation timed out")

        except Exception as e:
            raise RuntimeError(f"Pinecone index setup failed: {str(e)}")

    def preprocess_link(
        self, user_id: str, url: str, title: Optional[str] = None
    ) -> Dict:
        """
        Preprocess link: validate, extract content, detect topic, check duplicates.

        Returns:
            {
                "success": bool,
                "error": str or None,
                "data": {
                    "url": str,
                    "title": str,
                    "content": str,
                    "topic": str,
                    "chunks": List[str],
                    "is_duplicate": bool
                }
            }
        """
        try:
            # Validate URL
            if not self._validate_url(url):
                return {
                    "success": False,
                    "error": "Invalid or unreachable URL",
                    "data": None,
                }

            # Check for duplicates
            if self._is_duplicate(user_id, url):
                return {
                    "success": False,
                    "error": "Duplicate link for this user",
                    "data": None,
                }

            # Extract content
            content = self._extract_content(url)
            if not content or len(content.strip()) < 100:
                return {
                    "success": False,
                    "error": "Unable to extract sufficient content",
                    "data": None,
                }

            # Detect topic
            topic = self._detect_topic(content)

            # Normalize and chunk text
            normalized_content = self._normalize_text(content)
            chunks = self.text_splitter.split_text(normalized_content)

            # Get title
            final_title = title or self._extract_title(url, content)

            return {
                "success": True,
                "error": None,
                "data": {
                    "url": url,
                    "title": final_title,
                    "content": normalized_content,
                    "topic": topic,
                    "chunks": chunks,
                    "is_duplicate": False,
                },
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Preprocessing failed: {str(e)}",
                "data": None,
            }

    def _validate_url(self, url: str) -> bool:
        """Validate URL is reachable and not empty."""
        if not url or not url.strip():
            return False

        try:
            response = requests.head(url, timeout=10, allow_redirects=True)
            return response.status_code == 200
        except:
            return False

    def _is_duplicate(self, user_id: str, url: str) -> bool:
        """Check if link already exists for this user."""
        db = SessionLocal()
        try:
            existing = (
                db.query(UserLink)
                .filter(UserLink.user_id == user_id, UserLink.url == url)
                .first()
            )
            return existing is not None
        finally:
            db.close()

    def _extract_content(self, url: str) -> str:
        """Extract clean text content from URL."""
        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()
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

            return text
        except Exception:
            return ""

    def _detect_topic(self, content: str) -> str:
        """Detect topic from content using keyword matching with LLM fallback."""
        # Fast keyword matching first
        content_lower = content.lower()

        topic_map = {
            "Machine Learning": [
                "ml",
                "machine learning",
                "neural",
                "deep learning",
                "ai",
            ],
            "Python": ["python", "programming", "code", "function", "class"],
            "Database": ["sql", "database", "query", "table", "join"],
            "Web Development": ["html", "css", "javascript", "react", "api"],
            "Data Science": ["pandas", "numpy", "matplotlib", "statistics", "analysis"],
        }

        for topic, keywords in topic_map.items():
            if any(kw in content_lower for kw in keywords):
                return topic

        # Fallback to LLM (cached by content hash)
        content_hash = hashlib.md5(content[:1000].encode()).hexdigest()
        if content_hash in self._topic_cache:
            return self._topic_cache[content_hash]

        prompt = f"Main topic (2-5 words): {content[:500]}..."
        response = get_completion(prompt)
        topic = (
            response["content"].strip()[:50]
            if response["status"] == "success"
            else "General"
        )

        self._topic_cache[content_hash] = topic
        return topic

    def _normalize_text(self, text: str) -> str:
        """Normalize text: clean and prepare for chunking."""
        # Remove extra whitespace
        text = re.sub(r"\s+", " ", text.strip())
        # Remove non-printable characters
        text = re.sub(r"[^\x20-\x7E\n]", "", text)
        return text

    def _extract_title(self, url: str, content: str) -> str:
        """Extract title from URL or content."""
        # Try to get from URL path
        parsed = urlparse(url)
        path_parts = parsed.path.strip("/").split("/")
        if path_parts and path_parts[-1]:
            title = path_parts[-1].replace("-", " ").replace("_", " ").title()
            if len(title) > 10:
                return title

        # Fallback to first meaningful sentence
        sentences = content.split(".")[:3]
        for sentence in sentences:
            if len(sentence.strip()) > 20:
                return sentence.strip()[:100] + "..."

        return "Untitled Link"

    def store_link(self, user_id: str, url: str, title: Optional[str] = None) -> Dict:
        """
        Store link after preprocessing.

        Returns:
            {"success": bool, "error": str or None, "link_id": int or None}
        """
        # Preprocess
        preprocess_result = self.preprocess_link(user_id, url, title)
        if not preprocess_result["success"]:
            return {
                "success": False,
                "error": preprocess_result["error"],
                "link_id": None,
            }

        data = preprocess_result["data"]

        # Store in database
        db = SessionLocal()
        try:
            user_link = UserLink(
                user_id=user_id,
                url=data["url"],
                title=data["title"],
                topic=data["topic"],
                content=data["content"],
                weak_topics=json.dumps([]),  # Initialize as empty list
            )
            db.add(user_link)
            db.commit()
            db.refresh(user_link)

            # Create usage tracking
            link_usage = LinkUsage(
                user_link_id=user_link.id,
                user_id=user_id,
                access_count=0,
            )
            db.add(link_usage)
            db.commit()

            # Store in Pinecone
            self._store_in_pinecone(user_link.id, data["chunks"], data)

            return {"success": True, "error": None, "link_id": user_link.id}

        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "error": f"Storage failed: {str(e)}",
                "link_id": None,
            }
        finally:
            db.close()

    def _store_in_pinecone(self, link_id: int, chunks: List[str], metadata: Dict):
        """Store chunks with embeddings in Pinecone."""
        index = self.pc.Index(self.index_name)
        vectors = []

        for i, chunk in enumerate(chunks):
            # Generate embedding
            embedding = self.embeddings.embed_query(chunk)

            # Create unique ID
            chunk_id = f"{link_id}_{i}"

            # Prepare metadata
            chunk_metadata = {
                "user_id": metadata.get("user_id", ""),
                "url": metadata["url"],
                "topic": metadata["topic"],
                "title": metadata["title"],
                "timestamp": datetime.utcnow().isoformat(),
                "chunk_index": i,
                "total_chunks": len(chunks),
                "text": chunk,
                "weak_topics": [],  # Initialize for future tracking
            }

            vectors.append(
                {
                    "id": chunk_id,
                    "values": embedding,
                    "metadata": chunk_metadata,
                }
            )

        # Upsert in batches
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i : i + batch_size]
            index.upsert(vectors=batch)

    def retrieve_links(
        self, user_id: str, query: str, topic: Optional[str] = None, top_k: int = 10
    ) -> List[Dict]:
        """
        Retrieve personalized links based on query.

        Returns list of relevant chunks with metadata and ranking scores.
        """
        # Generate query embedding
        query_embedding = self.embeddings.embed_query(query)

        index = self.pc.Index(self.index_name)

        # Build filter for personalization
        filter_conditions = {"user_id": user_id}
        if topic:
            filter_conditions["topic"] = topic

        # Query Pinecone
        results = index.query(
            vector=query_embedding,
            filter=filter_conditions,
            top_k=top_k,
            include_metadata=True,
            include_values=False,
        )

        if not results["matches"]:
            # Fallback to global data if no personal results
            del filter_conditions["user_id"]
            results = index.query(
                vector=query_embedding,
                filter=filter_conditions,
                top_k=top_k,
                include_metadata=True,
                include_values=False,
            )

        # Apply history-based ranking
        ranked_results = self._apply_history_ranking(user_id, results["matches"])

        return ranked_results

    def _apply_history_ranking(self, user_id: str, matches: List[Dict]) -> List[Dict]:
        """Apply history-based ranking with batch queries and optimized scoring."""
        # Batch fetch usage data for only relevant links
        link_ids = [int(match["metadata"]["id"].split("_")[0]) for match in matches]
        unique_link_ids = list(set(link_ids))

        db = SessionLocal()
        try:
            usages = (
                db.query(LinkUsage)
                .filter(
                    LinkUsage.user_link_id.in_(unique_link_ids),
                    LinkUsage.user_id == user_id,
                )
                .all()
            )

            usage_dict = {u.user_link_id: u for u in usages}

            now = datetime.utcnow()
            for match in matches:
                metadata = match["metadata"]
                link_id = int(metadata["id"].split("_")[0])
                usage = usage_dict.get(link_id)

                boost = 0
                if usage:
                    # Frequency boost (diminishing returns)
                    boost += min(usage.access_count**0.5 * 0.2, 1.0)

                    # Recency boost (exponential decay)
                    days_old = (now - usage.last_accessed).total_seconds() / 86400
                    boost += max(0, 0.8 * (0.95**days_old))

                match["score"] += boost
                match["boost"] = boost

            matches.sort(key=lambda x: x["score"], reverse=True)
            return matches

        finally:
            db.close()

    def track_access(self, user_id: str, link_id: int):
        """Track link access for history-based ranking."""
        db = SessionLocal()
        try:
            usage = (
                db.query(LinkUsage)
                .filter(LinkUsage.user_link_id == link_id, LinkUsage.user_id == user_id)
                .first()
            )

            if usage:
                usage.access_count += 1
                usage.last_accessed = datetime.utcnow()
                db.commit()
        finally:
            db.close()

    def delete_link(self, user_id: str, link_id: int) -> bool:
        """Delete link from database and Pinecone."""
        db = SessionLocal()
        try:
            # Delete from database
            link = (
                db.query(UserLink)
                .filter(UserLink.id == link_id, UserLink.user_id == user_id)
                .first()
            )

            if not link:
                return False

            # Delete usage tracking
            db.query(LinkUsage).filter(LinkUsage.user_link_id == link_id).delete()

            db.delete(link)
            db.commit()

            # Delete from Pinecone
            index = self.pc.Index(self.index_name)
            # Delete all chunks for this link
            index.delete(filter={"id": {"$regex": f"^{link_id}_"}})

            return True

        except Exception:
            db.rollback()
            return False
        finally:
            db.close()


# Global instance
_personalized_links_manager = None


def get_personalized_links_manager() -> PersonalizedLinksManager:
    """Get or create the global personalized links manager instance."""
    global _personalized_links_manager
    if _personalized_links_manager is None:
        _personalized_links_manager = PersonalizedLinksManager()
    return _personalized_links_manager


def preprocess_and_store_link(
    user_id: str, url: str, title: Optional[str] = None
) -> Dict:
    """Convenience function to preprocess and store a link."""
    manager = get_personalized_links_manager()
    return manager.store_link(user_id, url, title)


def retrieve_personalized_links(
    user_id: str, query: str, topic: Optional[str] = None, top_k: int = 10
) -> List[Dict]:
    """Convenience function to retrieve personalized links."""
    manager = get_personalized_links_manager()
    return manager.retrieve_links(user_id, query, topic, top_k)


def track_link_access(user_id: str, link_id: int):
    """Convenience function to track link access."""
    manager = get_personalized_links_manager()
    manager.track_access(user_id, link_id)
