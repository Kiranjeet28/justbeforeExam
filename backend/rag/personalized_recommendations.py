"""Personalized Recommendations based on Weak Areas."""

import json
import re
from datetime import datetime, timedelta
from typing import Dict, List

from database import SessionLocal
from langchain_huggingface import HuggingFaceEmbeddings
from models import LinkUsage, QuizResult
from schemas import PersonalizedRecommendation

from rag.personalized_links import get_personalized_links_manager


class PersonalizedRecommendations:
    """Generates personalized recommendations based on weak areas."""

    def __init__(self):
        """Initialize with personalized links manager and embeddings."""
        self.links_manager = get_personalized_links_manager()
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
        )

    def generate_recommendations(
        self, user_id: str, weak_topics: List[str]
    ) -> List[PersonalizedRecommendation]:
        """
        Generate personalized recommendations for weak topics.

        Args:
            user_id: User identifier
            weak_topics: List of weak topic areas

        Returns:
            List of PersonalizedRecommendation objects
        """
        if not weak_topics:
            return []

        recommendations = []

        for topic in weak_topics:
            # Calculate priority for this topic
            priority = self._calculate_topic_priority(user_id, topic)

            # Retrieve relevant chunks for this topic
            relevant_chunks = self._retrieve_topic_chunks(user_id, topic)

            if not relevant_chunks:
                continue

            # Extract links and concepts
            recommended_links = self._extract_links(relevant_chunks)
            key_concepts = self._extract_key_concepts_dynamic(relevant_chunks, topic)

            # Generate short advice
            short_advice = self._generate_advice(topic, key_concepts, recommended_links)

            recommendation = PersonalizedRecommendation(
                topic=topic,
                priority=priority,
                recommended_links=recommended_links,
                key_concepts=key_concepts,
                short_advice=short_advice,
            )
            recommendations.append(recommendation)

        return recommendations

    def _calculate_topic_priority(self, user_id: str, topic: str) -> str:
        """Calculate priority based on mistake frequency and recency."""
        db = SessionLocal()
        try:
            # Get recent quiz results (last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            recent_results = (
                db.query(QuizResult)
                .filter(
                    QuizResult.user_id == user_id,
                    QuizResult.created_at >= thirty_days_ago,
                )
                .all()
            )

            if not recent_results:
                return "medium"

            # Count mistakes by topic
            topic_mistakes = 0
            total_mistakes = 0

            for result in recent_results:
                if result.mistakes:
                    try:
                        mistakes = json.loads(result.mistakes)
                        for mistake in mistakes:
                            total_mistakes += 1
                            if mistake.get("topic", "").lower() == topic.lower():
                                topic_mistakes += 1
                    except Exception:
                        continue

            if total_mistakes == 0:
                return "low"

            # Calculate mistake ratio
            mistake_ratio = topic_mistakes / total_mistakes

            # Priority based on ratio and recency
            if mistake_ratio > 0.4 or topic_mistakes > 5:
                return "high"
            elif mistake_ratio > 0.2 or topic_mistakes > 2:
                return "medium"
            else:
                return "low"

        finally:
            db.close()

    def _retrieve_topic_chunks(self, user_id: str, topic: str) -> List[Dict]:
        """Retrieve relevant chunks for a specific topic."""
        # Query Pinecone for user's content in this topic
        results = self.links_manager.retrieve_links(
            user_id=user_id,
            query=f"concepts related to {topic}",
            topic=topic,
            top_k=10,
        )

        # Filter and rank results
        ranked_results = self._rank_chunks(results, user_id)

        return ranked_results[:5]  # Top 5 most relevant

    def _rank_chunks(self, chunks: List[Dict], user_id: str) -> List[Dict]:
        """Rank chunks by relevance, access frequency, and recency."""
        if not chunks:
            return []

        db = SessionLocal()
        try:
            # Get usage data for ranking
            link_ids = []
            for chunk in chunks:
                metadata = chunk.get("metadata", {})
                chunk_id = metadata.get("id", "")
                if "_" in chunk_id:
                    link_id = int(chunk_id.split("_")[0])
                    link_ids.append(link_id)

            unique_link_ids = list(set(link_ids))
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

            # Rank chunks
            for chunk in chunks:
                metadata = chunk.get("metadata", {})
                chunk_id = metadata.get("id", "")
                link_id = int(chunk_id.split("_")[0]) if "_" in chunk_id else 0

                # Base similarity score
                score = chunk.get("score", 0)

                # Boost for access frequency and recency
                usage = usage_dict.get(link_id)
                if usage:
                    # Frequency boost
                    score += min(usage.access_count * 0.1, 0.5)

                    # Recency boost (newer content gets higher score)
                    days_old = (now - usage.last_accessed).total_seconds() / 86400
                    score += max(0, 0.3 * (1 - days_old / 30))  # Decay over 30 days

                    # Performance boost (links that improved quiz scores)
                    score += usage.performance_boost * 0.2

                chunk["final_score"] = score

            # Sort by final score
            chunks.sort(key=lambda x: x.get("final_score", 0), reverse=True)

            return chunks

        finally:
            db.close()

    def _extract_links(self, chunks: List[Dict]) -> List[Dict[str, str]]:
        """Extract unique links from chunks."""
        links = []
        seen_urls = set()

        for chunk in chunks:
            metadata = chunk.get("metadata", {})
            url = metadata.get("url")
            title = metadata.get("title", "Untitled")

            if url and url not in seen_urls:
                links.append({"title": title, "url": url})
                seen_urls.add(url)

                if len(links) >= 3:  # Limit to 3 links per topic
                    break

        return links

    def _extract_key_concepts_dynamic(
        self, chunks: List[Dict], topic: str
    ) -> List[str]:
        """Dynamically extract key concepts from chunk content using NLP."""
        all_text = ""
        for chunk in chunks[:3]:  # Use top 3 chunks
            text = chunk.get("metadata", {}).get("text", "")
            all_text += text + " "

        if not all_text.strip():
            return [f"Core {topic} concepts"]

        # Extract noun phrases and important terms
        concepts = self._extract_noun_phrases(all_text)

        # Filter and rank concepts
        filtered_concepts = []
        for concept in concepts:
            concept_lower = concept.lower()
            # Skip common words and very short terms
            if len(concept) < 4 or concept_lower in {
                "this",
                "that",
                "with",
                "from",
                "they",
                "have",
                "been",
                "were",
            }:
                continue

            # Boost concepts related to programming/education
            boost_words = {
                "function",
                "class",
                "method",
                "variable",
                "algorithm",
                "database",
                "query",
                "table",
                "sort",
                "search",
                "list",
                "array",
                "string",
                "number",
                "code",
                "program",
            }
            if any(word in concept_lower for word in boost_words):
                filtered_concepts.append(concept.title())
            elif len(filtered_concepts) < 3:  # Include some general terms
                filtered_concepts.append(concept.title())

        return filtered_concepts[:5] if filtered_concepts else [f"Key {topic} concepts"]

    def _extract_noun_phrases(self, text: str) -> List[str]:
        """Extract noun phrases from text."""
        # Simple noun phrase extraction using regex
        # Look for sequences of adjectives + nouns, or capitalized words
        text = re.sub(r"[^\w\s]", " ", text)  # Remove punctuation

        # Find potential concepts: capitalized words or adjective-noun pairs
        words = text.split()
        concepts = set()

        # Single important words
        for word in words:
            if len(word) > 3 and word[0].isupper():
                concepts.add(word)

        # Adjective-noun pairs
        for i in range(len(words) - 1):
            if (
                words[i][0].islower()
                and len(words[i]) > 2
                and words[i + 1][0].isupper()
                and len(words[i + 1]) > 2
            ):
                concepts.add(f"{words[i]} {words[i + 1]}")

        # Multi-word technical terms
        for i in range(len(words) - 2):
            phrase = " ".join(words[i : i + 3])
            if len(phrase) > 8 and sum(1 for w in words[i : i + 3] if len(w) > 3) >= 2:
                concepts.add(phrase.title())

        return list(concepts)

    def _generate_advice(
        self, topic: str, key_concepts: List[str], links: List[Dict]
    ) -> str:
        """Generate short, personalized advice."""
        if not key_concepts:
            return f"Review {topic} fundamentals from recommended links"

        if links:
            link_title = links[0].get("title", "the linked resource")
            primary_concepts = (
                key_concepts[:2] if len(key_concepts) >= 2 else key_concepts
            )
            return f"Focus on {', '.join(primary_concepts)} from {link_title}"

        return f"Practice {', '.join(key_concepts[:3])} exercises"

    def track_link_feedback(
        self, user_id: str, link_id: int, time_spent: int, clicked: bool = True
    ):
        """Track link usage feedback for adaptive recommendations."""
        db = SessionLocal()
        try:
            usage = (
                db.query(LinkUsage)
                .filter(LinkUsage.user_link_id == link_id, LinkUsage.user_id == user_id)
                .first()
            )

            if usage:
                if clicked:
                    usage.access_count += 1
                usage.time_spent += time_spent
                usage.last_accessed = datetime.utcnow()
                db.commit()
        finally:
            db.close()

    def update_performance_boost(
        self, user_id: str, link_id: int, improvement_score: float
    ):
        """Update performance boost for links that helped improve quiz scores."""
        db = SessionLocal()
        try:
            usage = (
                db.query(LinkUsage)
                .filter(LinkUsage.user_link_id == link_id, LinkUsage.user_id == user_id)
                .first()
            )

            if usage:
                # Exponential moving average for performance boost
                usage.performance_boost = (
                    0.7 * usage.performance_boost + 0.3 * improvement_score
                )
                db.commit()
        finally:
            db.close()


# Global instance
_personalized_recommendations = None


def get_personalized_recommendations() -> PersonalizedRecommendations:
    """Get or create the global personalized recommendations instance."""
    global _personalized_recommendations
    if _personalized_recommendations is None:
        _personalized_recommendations = PersonalizedRecommendations()
    return _personalized_recommendations


def generate_personalized_recommendations(
    user_id: str, weak_topics: List[str]
) -> List[PersonalizedRecommendation]:
    """Convenience function to generate personalized recommendations."""
    recommender = get_personalized_recommendations()
    return recommender.generate_recommendations(user_id, weak_topics)
