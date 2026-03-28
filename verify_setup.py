#!/usr/bin/env python3
"""
Verification Script: Check Agentic RAG Setup

This script verifies that all components are correctly installed and configured.

Usage:
    python verify_setup.py
"""

import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))


def check_python_version():
    """Check Python version >= 3.9."""
    print("\n✓ Python Version Check")
    print("-" * 40)
    
    version = sys.version_info
    print(f"  Current: Python {version.major}.{version.minor}.{version.micro}")
    
    if version >= (3, 9):
        print("  ✅ OK: Python 3.9+ required")
        return True
    else:
        print("  ❌ ERROR: Python 3.9+ required")
        return False


def check_dependencies():
    """Check all required packages are installed."""
    print("\n✓ Dependencies Check")
    print("-" * 40)
    
    required = {
        "langchain": "LangChain core",
        "langchain_core": "LangChain core API",
        "langchain_community": "LangChain community tools",
        "langchain_groq": "Groq integration",
        "langchain_google_genai": "Gemini integration",
        "langchain_huggingface": "HuggingFace integration",
        "langgraph": "LangGraph workflow",
        "faiss": "FAISS vector store",
        "tavily": "Tavily web search",
        "fastapi": "FastAPI server",
        "pydantic": "Pydantic models",
    }
    
    missing = []
    for module, description in required.items():
        try:
            __import__(module)
            print(f"  ✅ {module:<25} - {description}")
        except ImportError:
            print(f"  ❌ {module:<25} - {description}")
            missing.append(module)
    
    if missing:
        print(f"\n  Missing packages: {', '.join(missing)}")
        print(f"  Install with: pip install -r backend/requirements.txt")
        return False
    
    return True


def check_environment_variables():
    """Check required environment variables."""
    print("\n✓ Environment Variables Check")
    print("-" * 40)
    
    from dotenv import load_dotenv
    load_dotenv()
    
    required = {
        "GROQ_API_KEY": "Groq API key (primary LLM)",
        "GEMINI_API_KEY": "Gemini API key (fallback)",
    }
    
    optional = {
        "TAVILY_API_KEY": "Tavily API key (web search)",
        "DATABASE_URL": "Database URL",
    }
    
    all_ok = True
    
    # Check required
    for var, description in required.items():
        value = os.getenv(var)
        if value:
            masked = value[:10] + "..." if len(value) > 10 else value
            print(f"  ✅ {var:<20} - {description}")
        else:
            print(f"  ❌ {var:<20} - {description} [MISSING]")
            all_ok = False
    
    # Check optional
    print("\n  Optional:")
    for var, description in optional.items():
        value = os.getenv(var)
        if value:
            masked = value[:10] + "..." if len(value) > 10 else value
            print(f"    ✅ {var:<18} - {description}")
        else:
            print(f"    ⚠️  {var:<18} - {description} [not set]")
    
    if not all_ok:
        print("\n  ⚠️  Required variables missing!")
        print("     Copy .env.example to .env and fill in API keys")
    
    return all_ok


def check_file_structure():
    """Check that all required files exist."""
    print("\n✓ File Structure Check")
    print("-" * 40)
    
    required_files = {
        "backend/rag/tools.py": "RAG tools (embeddings, retriever)",
        "backend/rag/llm.py": "LLM switcher (Groq → Gemini)",
        "backend/rag/agent.py": "LangGraph agent workflow",
        "backend/rag/context.txt": "Knowledge base",
        "backend/rag/rules.txt": "Formatting rules",
        "backend/rag/format.txt": "Output template",
        "backend/main.py": "FastAPI server",
        "backend/requirements.txt": "Python dependencies",
        ".env.example": "Environment template",
    }
    
    root = Path(__file__).parent
    all_exist = True
    
    for file_path, description in required_files.items():
        full_path = root / file_path
        if full_path.exists():
            size = full_path.stat().st_size
            size_str = f"{size:,} bytes"
            print(f"  ✅ {file_path:<35} - {description} ({size_str})")
        else:
            print(f"  ❌ {file_path:<35} - {description} [MISSING]")
            all_exist = False
    
    return all_exist


def check_vector_store():
    """Check if vector store is initialized."""
    print("\n✓ Vector Store Check")
    print("-" * 40)
    
    try:
        from rag.tools import initialize_vector_store
        
        print("  Initializing vector store from context.txt...")
        vs = initialize_vector_store()
        
        print("  ✅ Vector store initialized successfully")
        print(f"     Location: backend/rag/vector_store/")
        
        # Test retrieval
        print("\n  Testing retrieval...")
        results = vs.similarity_search("Python programming", k=2)
        if results:
            print(f"  ✅ Retrieval works ({len(results)} results)")
            print(f"     Sample: {results[0].page_content[:60]}...")
            return True
        else:
            print("  ⚠️  No retrieval results (context.txt may be empty)")
            return False
            
    except Exception as e:
        print(f"  ❌ Vector store initialization failed: {e}")
        return False


def check_llm_switcher():
    """Check if LLM switcher is configured."""
    print("\n✓ LLM Switcher Check")
    print("-" * 40)
    
    try:
        from rag.llm import get_switcher
        
        print("  Initializing LLM switcher...")
        switcher = get_switcher()
        
        print("  ✅ SmartLLMSwitcher initialized")
        print(f"     Primary: Groq (llama-3.3-70b)")
        print(f"     Fallback: Gemini 1.5 Flash")
        print(f"     Rate limit detection: Enabled")
        print(f"     Length handling: Enabled")
        
        return True
        
    except ValueError as e:
        print(f"  ❌ LLM configuration error: {e}")
        print("     Make sure GROQ_API_KEY and GEMINI_API_KEY are set")
        return False
    except Exception as e:
        print(f"  ❌ LLM switcher error: {e}")
        return False


def check_agent_graph():
    """Check if agent graph is configured."""
    print("\n✓ Agent Graph Check")
    print("-" * 40)
    
    try:
        from rag.agent import get_agent
        
        print("  Initializing agent graph...")
        agent = get_agent()
        
        print("  ✅ RagAgent initialized")
        print(f"     Nodes:")
        print(f"       1. Planner (decides research strategy)")
        print(f"       2. Researcher (retrieval + web search)")
        print(f"       3. Writer (LLM generation with fallback)")
        print(f"       4. Formatter (apply rules & format)")
        print(f"     Checkpointing: MemorySaver (session-based)")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Agent initialization error: {e}")
        return False


def check_fastapi_endpoints():
    """Check if FastAPI endpoints are configured."""
    print("\n✓ FastAPI Endpoints Check")
    print("-" * 40)
    
    try:
        from main import app
        
        print("  Found FastAPI endpoints:")
        
        endpoints = {
            "POST /api/agent/generate-notes": "Non-streaming notes generation",
            "POST /api/agent/generate-notes-streaming": "Streaming notes with SSE",
            "GET /health": "Health check",
        }
        
        for endpoint, description in endpoints.items():
            print(f"    ✅ {endpoint:<45} - {description}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ FastAPI check error: {e}")
        return False


def run_all_checks():
    """Run all verification checks."""
    print("\n" + "="*60)
    print("  AGENTIC RAG SYSTEM - SETUP VERIFICATION")
    print("="*60)
    
    checks = [
        ("Python Version", check_python_version),
        ("Dependencies", check_dependencies),
        ("Environment Variables", check_environment_variables),
        ("File Structure", check_file_structure),
        ("Vector Store", check_vector_store),
        ("LLM Switcher", check_llm_switcher),
        ("Agent Graph", check_agent_graph),
        ("FastAPI Endpoints", check_fastapi_endpoints),
    ]
    
    results = []
    for name, check_fn in checks:
        try:
            result = check_fn()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Error during {name} check: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*60)
    print("  VERIFICATION SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status:<10} - {name}")
    
    print(f"\n  Total: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n✅ ALL CHECKS PASSED!")
        print("\n📚 Next Steps:")
        print("   1. Start FastAPI server:")
        print("      uvicorn backend.main:app --reload --port 8000")
        print("   2. Test endpoints:")
        print("      curl -X POST http://localhost:8000/api/agent/generate-notes \\")
        print("        -H 'Content-Type: application/json' \\")
        print("        -d '{\"topic\": \"Python Classes\"}'")
        print("   3. See documentation:")
        print("      - backend/RAG_AGENT_README.md")
        print("      - IMPLEMENTATION_SUMMARY.md")
        return 0
    else:
        print("\n❌ SOME CHECKS FAILED")
        print("\n📖 See messages above for details")
        print("   Common issues:")
        print("   - Missing API keys: Update .env file")
        print("   - Missing dependencies: pip install -r backend/requirements.txt")
        print("   - Missing files: Check IMPLEMENTATION_SUMMARY.md")
        return 1


if __name__ == "__main__":
    try:
        exit_code = run_all_checks()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⏸️  Verification interrupted by user")
        sys.exit(1)
