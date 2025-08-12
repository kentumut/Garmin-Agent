@echo off
REM Cross-platform backend startup script for Jarvis AI (Windows)

REM Get script directory
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist ".venv\" (
    echo ❌ Virtual environment not found in: %CD%\.venv
    echo 💡 Please run the main setup script first
    exit /b 1
)

REM Determine virtual environment activation script
if exist ".venv\Scripts\activate.bat" (
    set "ACTIVATE_SCRIPT=.venv\Scripts\activate.bat"
) else if exist ".venv\bin\activate" (
    set "ACTIVATE_SCRIPT=.venv\bin\activate"
) else (
    echo ❌ Cannot find virtual environment activation script
    echo 💡 Expected: .venv\Scripts\activate.bat or .venv\bin\activate
    exit /b 1
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call "%ACTIVATE_SCRIPT%"

REM Check if activation was successful
if "%VIRTUAL_ENV%"=="" (
    echo ❌ Failed to activate virtual environment
    echo 💡 Virtual environment path: %CD%\%ACTIVATE_SCRIPT%
    exit /b 1
)

echo ✅ Virtual environment activated: %VIRTUAL_ENV%

REM Find Python executable
set "PYTHON_CMD="
for %%c in (python python3 py) do (
    where %%c >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_CMD=%%c"
        goto :found_python
    )
)

:found_python
if "%PYTHON_CMD%"=="" (
    echo ❌ Python executable not found
    echo 💡 Please ensure Python is installed and accessible
    exit /b 1
)

echo 🐍 Using Python: %PYTHON_CMD%

REM Run the server
echo 🚀 Starting Jarvis AI Backend...
%PYTHON_CMD% server.py %*
