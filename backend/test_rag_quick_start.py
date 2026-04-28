#!/usr/bin/env python3
"""
Quick Start Guide for RAG Flow Test Script

Run this to quickly test with different URLs and queries.
"""

from test_rag_flow import RAGIngestionTester


# Example 1: Test with a Wikipedia page
def test_wikipedia():
    """Test with Wikipedia Machine Learning page."""
    tester = RAGIngestionTester()
    result = tester.run_full_test(
        url="https://en.wikipedia.org/wiki/Machine_learning",
        query="What is machine learning and neural networks?",
    )
    return result


# Example 2: Test with a different URL
def test_custom_url():
    """Test with a custom URL of your choice."""
    tester = RAGIngestionTester()

    # Replace with your URL
    custom_url = "https://en.wikipedia.org/wiki/Python_(programming_language)"
    custom_query = "What are Python's key features and uses?"

    result = tester.run_full_test(url=custom_url, query=custom_query)
    return result


# Example 3: Multiple tests with different URLs
def test_multiple():
    """Run multiple tests with different URLs."""
    tester = RAGIngestionTester()

    test_cases = [
        {
            "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
            "query": "What is artificial intelligence?",
        },
        {
            "url": "https://en.wikipedia.org/wiki/Deep_learning",
            "query": "How do neural networks learn?",
        },
    ]

    results = []
    for i, test in enumerate(test_cases, 1):
        print(f"\n\n{'=' * 80}")
        print(f"Running Test {i}/{len(test_cases)}")
        print(f"{'=' * 80}")

        try:
            result = tester.run_full_test(test["url"], test["query"])
            results.append(result)
        except Exception as e:
            print(f"Test {i} failed: {e}")

    return results


# Example 4: Test with custom chunk size
def test_with_custom_chunking():
    """Test with custom text chunking parameters."""
    import os

    from dotenv import load_dotenv
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from pinecone import Pinecone

    load_dotenv()

    tester = RAGIngestionTester(test_index_name="rag-test-custom-chunks")

    # Customize chunk size and overlap
    tester.text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,  # Larger chunks
        chunk_overlap=200,  # More overlap
        separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""],
    )

    result = tester.run_full_test(
        url="https://en.wikipedia.org/wiki/Data_science",
        query="What is data science and its applications?",
    )
    return result


# Example 5: Interactive mode
def interactive_test():
    """Interactive mode to test with user-provided URL and query."""
    print("\n" + "=" * 80)
    print("🚀 RAG FLOW TEST - INTERACTIVE MODE")
    print("=" * 80)

    url = input("\nEnter URL to test: ").strip()
    if not url:
        print("❌ No URL provided")
        return

    query = input("Enter search query (optional, press Enter to skip): ").strip()
    if not query:
        query = None

    try:
        tester = RAGIngestionTester()
        result = tester.run_full_test(url, query)
        return result
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return None


# Example 6: Debug mode with verbose output
def test_with_debug():
    """Test with debugging information."""
    print("\n" + "=" * 80)
    print("🐛 DEBUG MODE - VERBOSE OUTPUT")
    print("=" * 80)

    tester = RAGIngestionTester()

    # Enable detailed logging
    tester.verbose = True

    # Test a small URL for quick verification
    url = "https://en.wikipedia.org/wiki/Algorithm"
    query = "What is an algorithm?"

    result = tester.run_full_test(url, query)

    if result["success"]:
        print("\n📊 DETAILED RESULTS:")
        print(f"Test ID: {result['test_id']}")
        print(f"Number of matches: {len(result['results'])}")

        for i, match in enumerate(result["results"], 1):
            print(f"\nMatch {i}:")
            print(f"  Chunk ID: {match['chunk_id']}")
            print(f"  Score: {match['score']:.4f}")
            print(f"  URL: {match['url']}")
            print(f"  Chunk Index: {match['chunk_index']}")
            print(f"  Text Preview: {match['text'][:150]}...")

    return result


if __name__ == "__main__":
    import sys

    print("\n" + "╔" + "=" * 78 + "╗")
    print("║" + " " * 78 + "║")
    print("║" + "RAG FLOW TEST - QUICK START EXAMPLES".center(78) + "║")
    print("║" + " " * 78 + "║")
    print("╚" + "=" * 78 + "╝\n")

    print("Available examples:")
    print("  1. test_wikipedia() - Test with Wikipedia Machine Learning page")
    print("  2. test_custom_url() - Test with a custom URL")
    print("  3. test_multiple() - Run multiple tests")
    print("  4. test_with_custom_chunking() - Test with custom chunk sizes")
    print("  5. interactive_test() - Interactive mode (you provide URL)")
    print("  6. test_with_debug() - Debug mode with verbose output")

    print("\nUsage examples:")
    print("  from test_rag_quick_start import test_wikipedia")
    print("  result = test_wikipedia()")
    print("")
    print("  from test_rag_quick_start import interactive_test")
    print("  result = interactive_test()")
    print("")
    print("Or run directly:")
    print("  python test_rag_quick_start.py")
    print("")

    # Default: run Wikipedia test
    print("Running default test (Wikipedia Machine Learning)...\n")
    result = test_wikipedia()

    if result["success"]:
        print("\n✅ Test completed successfully!")
    else:
        print(f"\n❌ Test failed: {result.get('error', 'Unknown error')}")
