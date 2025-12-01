@echo off
REM Product Feed Comparator - Docker Quick Start for Windows

cls

echo ======================================================
echo.
echo    Product Feed Comparator - Docker Launcher
echo.
echo ======================================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed!
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop
    echo.
    echo After installation, run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

echo [INFO] Building and starting the application...
echo        This may take a minute on first run...
echo.

REM Build and start with docker-compose
docker-compose up --build -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================
    echo.
    echo         [OK] Application Started Successfully!
    echo.
    echo ======================================================
    echo.
    echo [INFO] Open your browser at:
    echo        http://localhost:3000
    echo.
    echo ------------------------------------------------------
    echo.
    echo Useful Docker commands:
    echo   * Stop:    docker-compose down
    echo   * Logs:    docker-compose logs -f
    echo   * Rebuild: docker-compose up --build
    echo.
    
    REM Wait for server to start
    timeout /t 3 /nobreak >nul
    
    REM Try to open the browser
    start http://localhost:3000
    
) else (
    echo.
    echo [ERROR] Failed to start the application
    echo Please check the error messages above
    echo.
)

pause
