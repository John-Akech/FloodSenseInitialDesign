@echo off
echo ========================================
echo FloodSense Web-GIS Platform Setup
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
)
echo ✓ Node.js is installed

echo.
echo [2/4] Installing frontend dependencies...
cd src\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed successfully

echo.
echo [3/4] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed. Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)
echo ✓ Python is installed

echo.
echo [4/4] Installing Python dependencies...
cd ..\..
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo WARNING: Some Python dependencies may have failed to install
)
echo ✓ Python dependencies processed

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the FloodSense Web-GIS Platform:
echo.
echo 1. Start the backend server:
echo    cd src\backend
echo    python main.py
echo.
echo 2. Start the frontend (in a new terminal):
echo    cd src\frontend  
echo    npm start
echo.
echo 3. Open your browser to:
echo    http://localhost:3000
echo.
echo Admin Login Credentials:
echo    Username: admin
echo    Password: floodsense2024
echo.
echo For more information, see WEB_GIS_FEATURES.md
echo.
pause