#!/usr/bin/env python3
"""
Quick Start: Test the Agentic RAG System

This script demonstrates how to use the RAG agent programmatically.

Usage:
    python quick_start.py
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from rag.agent import run_agent
from rag.llm import get_completion
from rag.tools import initialize_vector_store, create_retriever_tool


def test_vector_store():
    """Test the vector store retrieval."""
    print("\n" + "="*60)
    print("TEST 1: Vector Store Retrieval")
    print("="*60)
    
    vs = initialize_vector_store()
    retriever = create_retriever_tool(vs)
    
    test_queries = [
        "What are Python data structures?",
        "Explain sorting algorithms",
        "How does OOP work?"
    ]
    
    for query in test_queries:
        print(f"\n📝 Query: {query}")
        result = retriever.invoke(query)
        print(f"✓ Retrieved: {result[:150]}...")


def test_llm_fallback():
    """Test the LLM fallback mechanism."""
    print("\n" + "="*60)
    print("TEST 2: LLM Fallback Logic")
    print("="*60)
    
    test_prompts = [
        "What is recursion in programming?",
        "Explain the concept of inheritance in OOP",
        "List 5 sorting algorithms"
    ]
    
    for prompt in test_prompts:
        print(f"\n💬 Prompt: {prompt}")
        result = get_completion(prompt)
        
        print(f"   Model: {result['model']}")
        print(f"   Status: {result['status']}")
        if result['reason']:
            print(f"   Reason: {result['reason']}")
        print(f"   Response: {result['content'][:200]}...")


def test_full_agent():
    """Test the complete agentic RAG pipeline."""
    print("\n" + "="*60)
    print("TEST 3: Full Agentic RAG Pipeline")
    print("="*60)
    
    topics = [
        "Python Functions and Scope",
        "Database Normalization",
        "Web Development with REST APIs"
    ]
    
    for topic in topics:
        print(f"\n🚀 Topic: {topic}")
        print("-" * 40)
        
        result = run_agent(topic)
        
        print("\n📊 Status Updates:")
        for i, status in enumerate(result['status_updates'], 1):
            print(f"   {i}. {status}")
        
        print(f"\n📝 Notes Length: {len(result['notes'])} characters")
        print(f"🔍 Context Chunks: {len(result['context_data'])} characters")
        print(f"🌐 Web Search Used: {bool(result['web_research'])}")
        
        # Show excerpt of notes
        notes_excerpt = result['notes'][:300] if result['notes'] else "[No notes generated]"
        print(f"\n📄 Notes Preview:\n{notes_excerpt}...")


def test_streaming():
    """Demonstrate streaming capabilities."""
    print("\n" + "="*60)
    print("TEST 4: Real-Time Streaming Simulation")
    print("="*60)
    
    print("\n💭 This would stream status updates in real-time via FastAPI SSE")
    print("   Example frontend integration:")
    print("""
   const response = await fetch('/api/agent/generate-notes-streaming', {
     method: 'POST',
     body: JSON.stringify({ topic: 'Python Classes' }),
     headers: { 'Content-Type': 'application/json' }
   });
   
   const reader = response.body.getReader();
   while (true) {
     const { done, value } = await reader.read();
     if (done) break;
     
     const text = new TextDecoder().decode(value);
     const data = JSON.parse(text.replace('data: ', ''));
     console.log(data.status); // "📋 Planning...", "✓ Complete", etc.
   }
    """)


def test_session_continuity():
    """Test session-based checkpointing."""
    print("\n" + "="*60)
    print("TEST 5: Session-Based Checkpointing")
    print("="*60)
    
    print("\n✅ Running same topic twice with same thread_id...")
    
    thread_id = "test_session_123"
    topic = "Machine Learning Algorithms"
    
    # First run
    print(f"\n▶ First run (thread_id: {thread_id})")
    result1 = run_agent(topic, thread_id)
    print(f"  ✓ Generated {len(result1['notes'])} char notes")
    print(f"  ✓ Status updates: {len(result1['status_updates'])}")
    
    # Second run with same thread_id
    print(f"\n▶ Second run (same thread_id: {thread_id})")
    result2 = run_agent(topic, thread_id)
    print(f"  ✓ Generated {len(result2['notes'])} char notes")
    print(f"  ✓ Status updates: {len(result2['status_updates'])}")
    
    print("\n💡 With MemorySaver, subsequent calls can use previous context!")


def main():
    """Run all tests."""
    print("\n" + "🔥"*30)
    print("  AGENTIC RAG SYSTEM - QUICK START TEST SUITE")
    print("🔥"*30)
    
    try:
        # Uncomment to run specific tests
        test_vector_store()
        test_llm_fallback()
        test_full_agent()
        test_streaming()
        test_session_continuity()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED!")
        print("="*60)
        print("\n📚 Next Steps:")
        print("  1. Start FastAPI server: uvicorn main:app --reload")
        print("  2. Test endpoints with curl or Postman:")
        print("     - POST http://localhost:8000/api/agent/generate-notes")
        print("     - POST http://localhost:8000/api/agent/generate-notes-streaming")
        print("  3. Integrate with frontend React components")
        print("\n📖 See RAG_AGENT_README.md for complete documentation")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
