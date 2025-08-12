#!/bin/bash

# 🤖 Jarvis AI - One-Click Startup Script
# This script sets up and runs the entire Jarvis AI application

set -e  # Exit on any error

echo "🤖 Starting Jarvis AI..."
echo "=================================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Find Python executable (try different common names)
PYTHON_CMD=""
for cmd in python3 python py; do
    if command -v "$cmd" &> /dev/null; then
        # Verify it's Python 3
        if "$cmd" -c "import sys; exit(0 if sys.version_info[0] >= 3 else 1)" 2>/dev/null; then
            PYTHON_CMD="$cmd"
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo "❌ Python 3 is not installed. Please install Python 3"
    echo "💡 Tried: python3, python, py"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo "✅ Python $($PYTHON_CMD --version) detected (using: $PYTHON_CMD)"
echo

# Setup Backend
echo "🐍 Setting up Python backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating Python virtual environment..."
    "$PYTHON_CMD" -m venv .venv
fi

# Activate virtual environment and install dependencies
echo "📦 Installing Python dependencies..."
source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo "✅ Backend setup complete"
echo

# Setup Frontend
echo "⚛️ Setting up Electron + React frontend..."
cd ../jarvis-ai

# Install Node.js dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install --silent
else
    echo "✅ Node.js dependencies already installed"
fi

echo "✅ Frontend setup complete"
echo

# Start the application
echo "🚀 Starting Jarvis AI..."
echo "=================================="
echo "📱 The Electron app will open automatically"
echo "🎤 Press ⌘⇧Space (Cmd+Shift+Space) to activate voice recording"
echo "🌐 Or visit http://localhost:5173 in your browser (limited functionality)"
echo "🛑 Press Ctrl+C to stop the application"
echo

# Run the development server
npm run dev
