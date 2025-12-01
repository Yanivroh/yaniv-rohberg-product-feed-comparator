@echo off
REM Product Feed Comparator - Auto Start Script for Windows
REM This script will install dependencies and launch the application

echo.
echo ======================================
echo   Product Feed Comparator
echo   Auto Start Script
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo After installation, run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed
node --version
echo.

echo [OK] npm is installed
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    echo This may take a minute...
    echo.
    call npm install
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Installation failed!
        echo Please check your internet connection and try again.
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo [OK] Dependencies installed successfully!
    echo.
) else (
    echo [OK] Dependencies already installed
    echo.
)

echo ======================================
echo   Starting Application...
echo ======================================
echo.
echo The browser will open automatically at:
echo http://localhost:3000
echo.
echo To stop the server, close this window or press Ctrl+C
echo.

REM Start the development server
call npm run dev

pause
