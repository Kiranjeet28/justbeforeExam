"""RAG Tools: HuggingFace Embeddings, FAISS Vector Store, and Search Tools."""

import os
from pathlib import Path

from database import SessionLocal
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.tools import Tool, tool
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from models import Source


# Initialize HuggingFace Embeddings
def initialize_embeddings():
    """Initialize HuggingFace embeddings model."""
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},  # Use "cuda" if GPU available
    )


# Initialize or Load FAISS Vector Store
def initialize_vector_store(context_path: str = None):
    """
    Initialize FAISS vector store from context.txt file.
    Creates vector store if it doesn't exist, otherwise loads from disk.
    """
    if context_path is None:
        context_path = Path(__file__).parent / "context.txt"

    embeddings = initialize_embeddings()
    vector_store_path = Path(__file__).parent / "vector_store"

    # Try to load existing vector store
    if vector_store_path.exists():
        try:
            vector_store = FAISS.load_local(
                str(vector_store_path), embeddings, allow_dangerous_deserialization=True
            )
            print(f"✓ Loaded existing vector store from {vector_store_path}")
            return vector_store
        except Exception as e:
            print(f"Warning: Could not load vector store: {e}. Creating new one.")

    # Create new vector store from context.txt
    if not Path(context_path).exists():
        raise FileNotFoundError(f"Context file not found: {context_path}")

    with open(context_path, "r", encoding="utf-8") as f:
        text = f.read()

    # Split text into chunks by sections
    chunks = text.split("\n## ")
    documents = [
        Document(
            page_content=chunk if i == 0 else f"## {chunk}",
            metadata={"source": "context.txt", "type": "exam_notes"},
        )
        for i, chunk in enumerate(chunks)
        if chunk.strip()
    ]

    # Create FAISS vector store
    vector_store = FAISS.from_documents(documents, embeddings)

    # Save vector store locally
    vector_store.save_local(str(vector_store_path))
    print(f"✓ Created and saved vector store to {vector_store_path}")

    return vector_store


# Create Retriever Tool
def create_retriever_tool(vector_store=None):
    """Create a retriever tool from FAISS vector store."""
    if vector_store is None:
        vector_store = initialize_vector_store()

    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5},  # Retrieve top 5 chunks
    )

    @tool
    def retrieve_context(query: str) -> str:
        """
        Search the local vector store for relevant context using HuggingFace embeddings.

        Args:
            query: The search query

        Returns:
            Relevant context chunks from the vector store
        """
        results = retriever.invoke(query)
        if not results:
            return "No relevant context found in the knowledge base."

        context = "\n\n".join(
            [
                f"[Chunk {i + 1}] {result.page_content}"
                for i, result in enumerate(results)
            ]
        )
        return context

    return retrieve_context


# Create Web Search Tool
def create_web_search_tool():
    """Create a TavilySearchResults tool for web research."""
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        print("Warning: TAVILY_API_KEY not set. Web search will not work.")
        return None

    @tool
    def web_search(query: str) -> str:
        """
        Search the web for information using Tavily Search.

        Args:
            query: The search query

        Returns:
            Search results with relevant links and snippets
        """
        try:
            tavily = TavilySearchResults(max_results=5)
            results = tavily.invoke(query)
            if not results:
                return "No web results found."

            formatted_results = "\n\n".join(
                [
                    f"- {result.get('title', 'Untitled')}: {result.get('content', '')}"
                    for result in results
                ]
            )
            return formatted_results
        except Exception as e:
            return f"Web search failed: {str(e)}"

    return web_search


# Initialize all tools
def get_all_tools():
    """Get all RAG tools for the agent."""
    vector_store = initialize_vector_store()
    retriever_tool = create_retriever_tool(vector_store)
    web_search_tool = create_web_search_tool()

    tools = [retriever_tool]
    if web_search_tool:
        tools.append(web_search_tool)

    return tools, {"retriever": retriever_tool, "web_search": web_search_tool}


# Initialize FAISS Vector Store from Database Sources
def initialize_vector_store_from_db():
    """
    Initialize FAISS vector store from database sources.
    Creates vector store if it doesn't exist, otherwise loads from disk.
    """
    embeddings = initialize_embeddings()
    vector_store_path = Path(__file__).parent / "vector_store_db"

    # Try to load existing vector store
    if vector_store_path.exists():
        try:
            vector_store = FAISS.load_local(
                str(vector_store_path), embeddings, allow_dangerous_deserialization=True
            )
            print(f"✓ Loaded existing vector store from {vector_store_path}")
            return vector_store
        except Exception as e:
            print(f"Warning: Could not load vector store: {e}. Creating new one.")

    # Create new vector store from database sources
    db = SessionLocal()
    try:
        sources = db.query(Source).all()
        if not sources:
            raise ValueError("No sources found in database")

        documents = []
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""],
        )

        for source in sources:
            # Chunk the content
            chunks = text_splitter.split_text(source.content)

            for i, chunk in enumerate(chunks):
                # Construct URL based on source type
                if source.type == "video" and source.video_id:
                    url = f"https://www.youtube.com/watch?v={source.video_id}"
                elif source.type == "link":
                    # For links, URL might be in content or assume content is URL
                    url = source.content if source.content.startswith("http") else None
                else:
                    url = None

                metadata = {
                    "source_id": source.id,
                    "source_type": source.type,
                    "url": url,
                    "timestamp": source.timestamp.isoformat(),
                    "chunk_index": i,
                }

                doc = Document(page_content=chunk, metadata=metadata)
                documents.append(doc)

        # Create FAISS vector store
        vector_store = FAISS.from_documents(documents, embeddings)

        # Save vector store locally
        vector_store.save_local(str(vector_store_path))
        print(f"✓ Created and saved vector store from DB to {vector_store_path}")

        return vector_store

    finally:
        db.close()
