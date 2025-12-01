# 🚀 Quick Start Guide

## The Easiest Way to Run This Application

### For Mac / Linux Users:
1. **Double-click** on `START.sh`
   
   *Or from terminal:*
   ```bash
   ./START.sh
   ```

2. **That's it!** The application will:
   - ✅ Check if Node.js is installed
   - ✅ Install dependencies automatically (first time only)
   - ✅ Start the server
   - ✅ Open your browser at http://localhost:3000

---

### For Windows Users:
1. **Double-click** on `START.bat`

2. **That's it!** The application will:
   - ✅ Check if Node.js is installed
   - ✅ Install dependencies automatically (first time only)
   - ✅ Start the server
   - ✅ Open your browser at http://localhost:3000

---

## Prerequisites

**You only need Node.js installed:**
- Download from: https://nodejs.org
- Choose the LTS (Long Term Support) version
- Install with default settings

**That's all you need!**

---

## First Time Setup

### Option 1: Use the auto-start scripts ⭐ (Recommended)
- **Mac/Linux:** Double-click `START.sh`
- **Windows:** Double-click `START.bat`

### Option 2: Manual setup
```bash
npm install
npm run dev
```

---

## Stopping the Server

- **Close the terminal window**
- Or press `Ctrl+C` in the terminal

---

## Features

### 🌍 Multi-Environment Support
- Switch between Android, Hutch, and Sprint environments
- Each environment has pre-configured domain and token

### 🔍 Feed Comparison
- Add Product Feeds by ID
- Configure CD Parameters (locale, feature, source, etc.)
- Visual side-by-side comparison
- Image and color preview

### 🌐 CD Local Iteration Loop
- Automatically test all 27 locales
- Compare 2 feeds across all locales
- Detailed results with full value display
- Real-time progress tracking

### 📊 Export Options
- Export to JSON
- Export to CSV
- Debug panel with full request details

---

## Troubleshooting

### "Node.js is not installed"
- Download and install Node.js from: https://nodejs.org
- Restart your computer
- Try running the start script again

### "Port 3000 is already in use"
- The app will automatically try port 3001
- Or close other applications using port 3000

### The browser doesn't open automatically
- Manually open: http://localhost:3000

---

## Support

For questions or issues, check the full documentation in `DEPLOYMENT.md`

**Enjoy the Product Feed Comparator! 🎉**
