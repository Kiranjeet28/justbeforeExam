#!/bin/bash
set -e

echo "Starting backend from backend directory..."
cd backend
uvicorn main:app --host 0.0.0.0 --port 10000
