"""Agentic RAG with LangGraph: Planner, Researcher, Writer, Formatter Pipeline."""

import json
import logging
from typing import Annotated, Any, Optional
from pathlib import Path

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from typing_extensions import TypedDict

from .tools import get_all_tools
from .llm import get_completion
from .processor import MultiModelNotesGenerator

logger = logging.getLogger(__name__)


# Define State
class AgentState(TypedDict):
    """State maintained throughout the agent execution."""

    messages: list[dict]  # Conversation history
    context_data: str  # Retrieved context from vector store
    web_research: str  # Web search results
    research_plan: str  # Plan from planner node
    draft_notes: str  # Draft output from writer node
    final_notes: str  # Formatted output from formatter node
    status_updates: list[str]  # Status messages for frontend
    topic: str  # The exam topic to prepare notes for
    engine_used: str  # Track which engine(s) were used: "Groq" or "Groq + Gemini"


class RagAgent:
    """RAG Agent with Planner, Researcher, Writer, Formatter nodes."""

    def __init__(self):
        """Initialize the RAG agent with tools and state graph."""
        self.tools, self.tool_dict = get_all_tools()
        self.checkpointer = MemorySaver()
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        workflow = StateGraph(AgentState)

        # Add nodes
        workflow.add_node("planner", self._planner_node)
        workflow.add_node("researcher", self._researcher_node)
        workflow.add_node("writer", self._writer_node)
        workflow.add_node("formatter", self._formatter_node)

        # Add edges
        workflow.add_edge(START, "planner")
        workflow.add_edge("planner", "researcher")
        workflow.add_edge("researcher", "writer")
        workflow.add_edge("writer", "formatter")
        workflow.add_edge("formatter", END)

        # Add checkpointer for session management
        return workflow.compile(checkpointer=self.checkpointer)

    def _planner_node(self, state: AgentState) -> AgentState:
        """
        Planner Node: Decides what information is needed from context vs. web.
        """
        state["status_updates"].append("📋 Planning research strategy...")

        topic = state.get("topic", "")
        messages = state.get("messages", [])

        # Build planning prompt
        plan_prompt = f"""You are an exam preparation assistant. 
A student wants to prepare notes on: "{topic}"

Decide whether to:
1. Use local context retrieval (from knowledge base)
2. Search the web for current information
3. Both

Provide a brief plan in 2-3 sentences."""

        result = get_completion(plan_prompt)
        plan = result.get("content", "Use local context and web search")

        state["research_plan"] = plan
        state["status_updates"].append(f"✓ Plan: {plan[:100]}...")

        return state

    def _researcher_node(self, state: AgentState) -> AgentState:
        """
        Researcher Node: Uses RetrieverTool and WebSearch to gather information.
        """
        topic = state.get("topic", "")
        state["status_updates"].append(f"🔍 Researching '{topic}'...")

        # Retrieve from local context
        if self.tool_dict.get("retriever"):
            state["status_updates"].append("📚 Searching knowledge base...")
            try:
                context = self.tool_dict["retriever"].invoke(topic)
                state["context_data"] = context
                state["status_updates"].append(f"✓ Retrieved {len(context)} chars from knowledge base")
            except Exception as e:
                state["status_updates"].append(f"⚠ Context retrieval failed: {str(e)}")
                state["context_data"] = ""

        # Web search if available
        if self.tool_dict.get("web_search"):
            state["status_updates"].append("🌐 Searching the web...")
            try:
                web_results = self.tool_dict["web_search"].invoke(topic)
                state["web_research"] = web_results
                state["status_updates"].append(f"✓ Found web results")
            except Exception as e:
                state["status_updates"].append(f"⚠ Web search failed: {str(e)}")
                state["web_research"] = ""

        return state

    def _writer_node(self, state: AgentState) -> AgentState:
        """
        Writer Node: Uses MultiModelNotesGenerator with Groq primary + Gemini fallback.
        Handles:
        - 429 rate limit: Switch to Gemini
        - Length exceeded (finish_reason='length'): Continue with Gemini
        """
        topic = state.get("topic", "")
        context = state.get("context_data", "")
        web_research = state.get("web_research", "")

        state["status_updates"].append("✍️  Generating notes with AI...")

        # Build writing prompt - emphasize human-like, natural style
        user_input = f"""Create study notes for exam preparation on: {topic}

Study Materials:
{context}

Additional Research:
{web_research}

Write these notes as a student would after understanding the material:
- Natural flow and clear explanations
- Only key concepts and important ideas
- Use bold for critical keywords
- Short, scannable bullet points for main ideas
- Real examples to clarify concepts
- NO Context or Sources section
- Skip unnecessary structure
- Focus on what matters for exams

Generate comprehensive but concise exam notes."""

        try:
            # Use multi-model generator with Groq primary + Gemini fallback
            generator = MultiModelNotesGenerator()
            result = generator.generate_full_notes(user_input)

            state["draft_notes"] = result["content"]
            state["engine_used"] = result["engine"]

            if result["engine"] == "Groq":
                state["status_updates"].append("✓ Draft generated with Groq")
            elif result["engine"] == "Groq+Gemini":
                state["status_updates"].append("⚡ Groq truncated - Continued with Gemini")
            elif result["engine"] == "Gemini":
                state["status_updates"].append("⚡ Groq rate limited (429) - Switched to Gemini")

            state["status_updates"].append("✓ Notes generated")

        except Exception as e:
            state["status_updates"].append(f"❌ Generation failed: {str(e)}")
            state["draft_notes"] = ""
            state["engine_used"] = "Unknown"

        return state

    def _is_abrupt_ending(self, text: str) -> bool:
        """Check if text ends abruptly (not ending with period, closing bracket, etc)."""
        if not text.strip():
            return False

        text = text.strip()
        # Check if ends with proper punctuation or closing brackets
        proper_endings = (".", "!", "?", ")", "]", "}", "`", ">", "-", "*")
        return not text.endswith(proper_endings)

    def _formatter_node(self, state: AgentState) -> AgentState:
        """
        Formatter Node: 
        1. Checks if draft notes end abruptly
        2. If abrupt, regenerates with continuation
        3. Applies rules.txt and format.txt
        """
        state["status_updates"].append("🎨 Formatting and checking completeness...")

        draft = state.get("draft_notes", "")

        # Load formatting rules
        rules_path = Path(__file__).parent / "rules.txt"
        format_path = Path(__file__).parent / "format.txt"

        rules = ""
        format_template = ""

        if rules_path.exists():
            with open(rules_path, "r") as f:
                rules = f.read()

        if format_path.exists():
            with open(format_path, "r") as f:
                format_template = f.read()

        # Check if draft ends abruptly
        if self._is_abrupt_ending(draft):
            state["status_updates"].append("⚠️  Draft ended abruptly - Requesting continuation...")
            
            # Request continuation
            continuation_prompt = f"""The following exam notes ended abruptly. Please CONTINUE and COMPLETE them:

PARTIAL NOTES:
{draft}

RULES TO FOLLOW:
{rules}

CONTINUE FROM WHERE IT STOPPED and complete all remaining sections. 
Do NOT repeat what came before. 
Ensure the notes are complete with all sections properly closed."""

            result = get_completion(continuation_prompt)
            continued_draft = draft + "\n\n" + result.get("content", "")
            state["status_updates"].append("✓ Notes continued and completed")
        else:
            continued_draft = draft
            state["status_updates"].append("✓ Draft is complete")

        # Build formatting prompt
        format_prompt = f"""Apply these formatting rules to the exam notes:

RULES:
{rules}

FORMAT TEMPLATE:
{format_template}

DRAFT NOTES TO FORMAT:
{continued_draft}

Return the properly formatted and rule-compliant exam notes."""

        result = get_completion(format_prompt)
        state["final_notes"] = result.get("content", continued_draft)
        state["status_updates"].append("✓ Formatting complete")

        return state

    def run(self, topic: str, thread_id: str = None) -> dict:
        """
        Run the agent pipeline for a given exam topic.

        Args:
            topic: The exam topic to prepare notes for
            thread_id: Optional thread ID for session continuity

        Returns:
            {
                "topic": topic,
                "notes": final formatted notes,
                "status_updates": list of status messages,
                "context_data": retrieved context,
                "web_research": web search results,
                "research_plan": planner's decision,
                "draft_notes": writer's draft
            }
        """
        config = {"configurable": {"thread_id": thread_id or "default"}} if thread_id else None

        initial_state: AgentState = {
            "messages": [],
            "context_data": "",
            "web_research": "",
            "research_plan": "",
            "draft_notes": "",
            "final_notes": "",
            "status_updates": [],
            "topic": topic,
            "engine_used": "Unknown",
        }

        # Execute the graph
        final_state = self.graph.invoke(initial_state, config=config)

        return {
            "topic": topic,
            "notes": final_state.get("final_notes", ""),
            "status_updates": final_state.get("status_updates", []),
            "context_data": final_state.get("context_data", ""),
            "web_research": final_state.get("web_research", ""),
            "research_plan": final_state.get("research_plan", ""),
            "draft_notes": final_state.get("draft_notes", ""),
            "engine_used": final_state.get("engine_used", "Unknown"),
        }


# Global agent instance
_agent = None


def get_agent() -> RagAgent:
    """Get or create the global RAG agent instance."""
    global _agent
    if _agent is None:
        _agent = RagAgent()
    return _agent


def run_agent(topic: str, thread_id: str = None) -> dict:
    """Convenience function to run the agent."""
    agent = get_agent()
    return agent.run(topic, thread_id)
