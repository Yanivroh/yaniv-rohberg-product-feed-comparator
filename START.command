#!/bin/bash

# Product Feed Comparator - Auto Start Script for Mac
# This script will install dependencies and launch the application

# Change to the script's directory
cd "$(dirname "$0")"

clear

echo "╔══════════════════════════════════════════════════════╗"
echo "║                                                      ║"
echo "║       Product Feed Comparator - Starting...         ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
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
    echo "📦 Installing dependencies..."
    echo "   (This may take a minute - please wait)"
    echo ""
    npm install
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Installation failed!"
        echo "Please check your internet connection and try again."
        echo ""
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

echo "╔══════════════════════════════════════════════════════╗"
echo "║                                                      ║"
echo "║         🌟 Starting Application...                   ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "The browser will open automatically at:"
echo "👉 http://localhost:3000"
echo ""
echo "To stop the server: Press Ctrl+C"
echo ""
echo "──────────────────────────────────────────────────────"
echo ""

# Start the development server
npm run dev

echo ""
echo "Server stopped. You can close this window."
read -p "Press Enter to exit..."
