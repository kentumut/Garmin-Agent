@echo off
REM 🤖 Jarvis AI - One-Click Startup Script (Windows)
REM This script sets up and runs the entire Jarvis AI application

echo 🤖 Starting Jarvis AI...
echo ==================================

REM Get the script directory
cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Find Python executable
set "PYTHON_CMD="
for %%c in (python python3 py) do (
    where %%c >nul 2>&1
    if not errorlevel 1 (
        REM Verify it's Python 3
        %%c -c "import sys; exit(0 if sys.version_info[0] >= 3 else 1)" >nul 2>&1
        if not errorlevel 1 (
            set "PYTHON_CMD=%%c"
            goto :found_python
        )
    )
)

:found_python
if "%PYTHON_CMD%"=="" (
    echo ❌ Python 3 is not installed. Please install Python 3
    echo 💡 Tried: python, python3, py
    pause
    exit /b 1
)

REM Get versions
for /f "tokens=*" %%v in ('node --version') do set "NODE_VERSION=%%v"
for /f "tokens=*" %%v in ('%PYTHON_CMD% --version') do set "PYTHON_VERSION=%%v"

echo ✅ Node.js %NODE_VERSION% detected
echo ✅ %PYTHON_VERSION% detected (using: %PYTHON_CMD%)
echo.

REM Setup Backend
echo 🐍 Setting up Python backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist ".venv\" (
    echo 📦 Creating Python virtual environment...
    %PYTHON_CMD% -m venv .venv
)

REM Activate virtual environment and install dependencies
echo 📦 Installing Python dependencies...
call .venv\Scripts\activate.bat
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo ✅ Backend setup complete
echo.

REM Setup Frontend
echo ⚛️ Setting up Electron + React frontend...
cd ..\jarvis-ai

REM Install Node.js dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo 📦 Installing Node.js dependencies...
    npm install --silent
) else (
    echo ✅ Node.js dependencies already installed
)

echo ✅ Frontend setup complete
echo.

REM Start the application
echo 🚀 Starting Jarvis AI...
echo ==================================
echo 📱 The Electron app will open automatically
echo 🎤 Press Ctrl+Shift+Space to activate voice recording
echo 🌐 Or visit http://localhost:5173 in your browser (limited functionality)
echo 🛑 Press Ctrl+C to stop the application
echo.

REM Run the development server
npm run dev
