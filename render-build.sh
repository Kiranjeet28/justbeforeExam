#!/bin/bash
set -e

echo "Starting Render build process..."
cd backend
echo "Installing Python dependencies from backend/requirements.txt..."
pip install -r requirements.txt
echo "Build complete!"
