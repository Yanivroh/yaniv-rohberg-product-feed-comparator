#!/bin/bash

# Product Feed Comparator - Auto Start Script
# This script will install dependencies and launch the application

echo "🚀 Product Feed Comparator - Starting..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org"
    echo "After installation, run this script again."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (this may take a minute)..."
    echo ""
    npm install
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Installation failed!"
        echo "Please check your internet connection and try again."
        read -p "Press Enter to exit..."
        exit 1
    fi
    
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

echo "🌟 Starting application..."
echo ""
echo "The browser will open automatically at http://localhost:3000"
echo ""
echo "To stop the server, press Ctrl+C"
echo ""

# Start the development server
npm run dev
