#!/bin/bash
cd /home/kiranjeet-kour/Desktop/Projects/justbeforeExam/backend
. venv/bin/activate

echo "Installing dependencies..."
pip install --prefer-binary langgraph langchain-community tavily-python faiss-cpu sentence-transformers -q
echo "Dependencies installed!"
