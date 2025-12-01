#!/bin/bash

# Product Feed Comparator - Docker Quick Start
# This script will build and run the application in Docker

clear

echo "╔══════════════════════════════════════════════════════╗"
echo "║                                                      ║"
echo "║    Product Feed Comparator - Docker Launcher        ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "❌ Docker is not installed!"
    echo ""
    echo "Please install Docker Desktop from:"
    echo "👉 https://www.docker.com/products/docker-desktop"
    echo ""
    echo "After installation, run this script again."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null
then
    echo "❌ Docker is not running!"
    echo ""
    echo "Please start Docker Desktop and try again."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Docker is installed and running"
echo ""

echo "📦 Building and starting the application..."
echo "   (This may take a minute on first run)"
echo ""

# Build and start with docker-compose
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║                                                      ║"
    echo "║         ✅ Application Started Successfully!         ║"
    echo "║                                                      ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 Open your browser at:"
    echo "👉 http://localhost:3000"
    echo ""
    echo "──────────────────────────────────────────────────────"
    echo ""
    echo "📋 Useful Docker commands:"
    echo "   • Stop:    docker-compose down"
    echo "   • Logs:    docker-compose logs -f"
    echo "   • Rebuild: docker-compose up --build"
    echo ""
    
    # Wait a moment for the server to start
    sleep 3
    
    # Try to open the browser
    if command -v open &> /dev/null; then
        open http://localhost:3000
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    fi
    
else
    echo ""
    echo "❌ Failed to start the application"
    echo "Please check the error messages above"
    echo ""
fi

read -p "Press Enter to exit..."
