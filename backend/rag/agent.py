"""Agentic RAG with LangGraph: Planner, Researcher, Writer, Formatter Pipeline."""

import json
from typing import Annotated, Any, Optional
from pathlib import Path

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from typing_extensions import TypedDict

from .tools import get_all_tools
from .llm import get_completion


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


class RagAgent:
    """RAG Agent with Planner, Researcher, Writer, Formatter nodes."""

    def __init__(self):
        """Initialize the RAG agent with tools and state graph."""
        self.tools, self.tool_dict = get_all_tools()
        self.graph = self._build_graph()
        self.checkpointer = MemorySaver()

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
        Writer Node: Calls get_completion to generate draft notes.
        Implements Groq->Gemini fallback.
        """
        topic = state.get("topic", "")
        context = state.get("context_data", "")
        web_research = state.get("web_research", "")

        state["status_updates"].append("✍️  Generating notes with AI...")

        # Build writing prompt
        write_prompt = f"""Create comprehensive exam notes for: {topic}

Retrieved Context:
{context}

Web Research:
{web_research}

Generate well-structured, detailed exam notes. Include:
- Key concepts and definitions
- Important facts and examples
- Study tips and mnemonics
- Practice questions

Format as markdown with clear sections."""

        # Get completion with fallback
        result = get_completion(write_prompt)

        if result["status"] == "success":
            state["status_updates"].append(f"✓ Draft generated with {result['model']}")
        elif result["status"] == "fallback":
            state["status_updates"].append(
                f"⚡ Groq rate limited - Switched to Gemini. Reason: {result.get('reason', '')}"
            )
        else:
            state["status_updates"].append(f"❌ Generation failed: {result.get('reason')}")

        state["draft_notes"] = result.get("content", "")
        state["status_updates"].append("✓ Notes generated")

        return state

    def _formatter_node(self, state: AgentState) -> AgentState:
        """
        Formatter Node: Applies rules.txt and format.txt to the draft.
        """
        state["status_updates"].append("🎨 Formatting and applying rules...")

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

        # Build formatting prompt
        format_prompt = f"""Apply these formatting rules to the exam notes:

RULES:
{rules}

FORMAT TEMPLATE:
{format_template}

DRAFT NOTES TO FORMAT:
{draft}

Return the properly formatted and rule-compliant exam notes."""

        result = get_completion(format_prompt)
        state["final_notes"] = result.get("content", draft)
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
