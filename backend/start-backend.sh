#!/bin/bash
# Cross-platform backend startup script for Jarvis AI

# Get script directory (works on macOS, Linux, and most Unix systems)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found in: $SCRIPT_DIR/.venv"
    echo "💡 Please run the main setup script first: ./run.sh"
    exit 1
fi

# Determine virtual environment activation script
if [ -f ".venv/bin/activate" ]; then
    # Unix/macOS
    ACTIVATE_SCRIPT=".venv/bin/activate"
elif [ -f ".venv/Scripts/activate" ]; then
    # Windows (Git Bash, WSL, etc.)
    ACTIVATE_SCRIPT=".venv/Scripts/activate"
else
    echo "❌ Cannot find virtual environment activation script"
    echo "💡 Expected: .venv/bin/activate or .venv/Scripts/activate"
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source "$ACTIVATE_SCRIPT"

# Check if activation was successful
if [ -z "$VIRTUAL_ENV" ]; then
    echo "❌ Failed to activate virtual environment"
    echo "💡 Virtual environment path: $SCRIPT_DIR/$ACTIVATE_SCRIPT"
    exit 1
fi

echo "✅ Virtual environment activated: $VIRTUAL_ENV"

# Find Python executable (try different common names)
PYTHON_CMD=""
for cmd in python3 python py; do
    if command -v "$cmd" >/dev/null 2>&1; then
        PYTHON_CMD="$cmd"
        break
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo "❌ Python executable not found"
    echo "💡 Please ensure Python is installed and accessible"
    exit 1
fi

echo "🐍 Using Python: $PYTHON_CMD ($(which $PYTHON_CMD))"

# Run the server
echo "🚀 Starting Jarvis AI Backend..."
exec "$PYTHON_CMD" server.py "$@"
