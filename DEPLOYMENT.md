# Product Feed Comparator - Deployment Guide

## 📦 How to Share This Application

### Option 1: Share via GitHub (Recommended)
The easiest way for others to use this application:

1. **Share the GitHub Repository URL:**
   ```
   https://github.com/Yanivroh/yaniv-rohberg-product-feed-comparator.git
   ```

2. **Others can clone and run:**
   ```bash
   git clone https://github.com/Yanivroh/yaniv-rohberg-product-feed-comparator.git
   cd yaniv-rohberg-product-feed-comparator
   npm install
   npm run dev
   ```

3. **The app will open at:** `http://localhost:3000`

---

### Option 2: Share as ZIP File

#### Creating the ZIP:
1. **Clean the project** (remove node_modules to reduce size):
   ```bash
   rm -rf node_modules
   ```

2. **Create ZIP file:**
   ```bash
   zip -r product-feed-comparator.zip . -x "*.git*" -x "*node_modules*"
   ```

#### For Recipients:
1. **Extract the ZIP file**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the application:**
   ```bash
   npm run dev
   ```
4. **Open browser at:** `http://localhost:3000`

---

## 🔧 Prerequisites

Users need to have installed:
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

Check with:
```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org/

---

## 🌍 Environment Configuration

The application supports 3 environments:
- **Android** (ape-androids.isappcloud.com)
- **Hutch** (ape-hutch.isappcloud.com)
- **Sprint** (ape-sprint.isappcloud.com)

All tokens are pre-configured in the code.

---

## ✨ Features

### 1. Multi-Environment Support
- Switch between Android, Hutch, and Sprint environments
- Each environment has its own domain and authentication token

### 2. Feed Comparison
- Add multiple Product Feeds by ID
- Configure CD Parameters (locale, feature, source, sis, rt)
- Fetch and compare feeds side-by-side
- Visual difference highlighting

### 3. CD Local Iteration Loop
- Automatically test all 27 locales
- Compare 2 feeds across all locales
- Detailed results with value comparison
- Real-time progress tracking

### 4. Advanced Rendering
- Image preview for URL fields
- Color preview for hex color codes (supports Android ARGB format)
- Missing value detection
- Export to JSON/CSV

---

## 📝 Usage Instructions

1. **Select Environment** (Android/Hutch/Sprint)
2. **Add Feed IDs** with optional CD parameters
3. **Fetch All Feeds** to load the data
4. **Compare Feeds** to see differences
5. **Use CD Local Iteration Loop** to test all locales automatically

---

## 🚀 Building for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist/` folder, ready for deployment to any static hosting service.

---

## 📞 Support

For issues or questions, contact the development team.

**Repository:** https://github.com/Yanivroh/yaniv-rohberg-product-feed-comparator
