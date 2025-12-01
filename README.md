# �� Product Feed Comparator

A professional web-based tool for comparing and analyzing differences between product feed configurations.

## ✨ Key Features

- **Simple Feed Management**: Enter only the Product Feed ID - the app builds the full URL automatically
- **Multi-Feed Support**: Add, edit, and delete multiple feeds (2 or more)
- **Automatic Data Fetching**: Fetch all feeds with a single click
- **Properties-Focused Analysis**: Focuses only on `properties` and ignores other data
- **Smart Difference Detection**: 
  - Shows **only differences** - missing keys and different values
  - Intelligent parsing of embedded JSON (`screenFeedsConfig`, `appUnitsConfig`, `specialOffersAppFeedGUIDs`)
  - Detects differences in Feed ID order within `screenFeedsConfig`
- **Professional UI**: 
  - Intuitive user interface with color-coded differences
  - Styled code display for JSON configs
  - Prominent Feed ID display with order numbering
- **Advanced Search**: Filter differences by key name
- **Export Options**: Export results to JSON or CSV

## 🚀 Installation & Setup

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will automatically open in your browser at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## 📖 How to Use

### 1. Add Feeds with CD Parameters

1. Click "Configure" under "Context Data (CD) Parameters" to set parameters **for this specific feed** (optional):
   - **Locale (l)**: Select language (English, Japanese, etc.)
   - **Feature (af)**: Choose feature type (recurring OOBE, post OOBE, reef, gotw)
   - **Source (src)**: Enter source value (e.g., FOTA)
   - **SIS (sis)**: Boolean value (true/false)
   - **RT (rt)**: Boolean value (true/false)
   - Leave any field empty to use default values
   
2. Enter the **Product Feed ID** (e.g., `db23c55b-d82e-4a3b-a4a2-f82226e5fd44`)
3. Optional: Add a descriptive label for easy identification
4. Click "Add Feed"

**Important**: Each feed can have its own CD parameters! This allows you to compare the same feed ID with different configurations (e.g., different locales or features).

The app automatically builds the full URL with the feed's specific CD parameters:
```
https://ape-androids.isappcloud.com/feeds/{PRODUCT_FEED_ID}?tk=...&x-cc=US&debug=true&segment=true&cd={...}
```

### 3. Fetch Data

1. After adding at least 2 feeds
2. Click "Fetch All Feeds"
3. The app performs GET requests to all URLs and displays status

### 4. Compare Feeds

1. After successfully fetching at least 2 feeds
2. Click "🔍 Compare Feeds & Show Differences"
3. The app will analyze and display:
   - **If there are differences**: Detailed comparison table with all differences
   - **If feeds are identical**: Green success message "✅ Feeds are Identical!"

## 🎯 What Gets Compared?

The app shows **only differences** in `properties`:

### 📦 Properties Focus
The app analyzes only the `properties` object from each feed:
```json
{
  "properties": {
    "welcomeScreenTitleText": "...",
    "screenFeedsConfig": "[...]",
    ...
  }
}
```
Everything else in the JSON (metadata, timestamps, etc.) is ignored.

### 🔴 Missing Keys
Keys that exist in one or more feeds, but not in all:
```
key_name | Feed A: ✓ true | Feed B: ❌ Missing | Feed C: ✓ false
```

### 🟡 Different Values
Keys that exist in all feeds but have different values:
```
welcomeScreenTitleText | Feed A: "Discover apps" | Feed B: "Install apps" | Feed C: "Discover apps"
```

### 🎨 Advanced JSON Analysis
The app intelligently parses fields with embedded JSON:

#### `screenFeedsConfig` - Advanced Feed IDs Analysis
The app focuses specifically on **Feed IDs** and performs detailed analysis:

**What's Checked:**
- 📋 **Feed ID List**: All Feed IDs that appear in order
- 🔢 **Count**: Whether there's the same number of Feed IDs
- 🔄 **Order**: Whether Feed IDs appear in the same order
- 🆔 **Identity**: Whether it's the same Feed IDs (even if order is different)

**Special Display:**
- Orange summary box with main differences
- Numbered list of Feed IDs for each product feed
- Full JSON hidden under "Show additional info" (click to expand)

**Types of Differences Detected:**
- 🔴 **Completely different IDs**: Entirely different Feed IDs
- 🟡 **Same IDs but different order**: Same feeds but in different order
- �� **Same IDs but different count**: Feed ID appears more than once

#### `appUnitsConfig` & `specialOffersAppFeedGUIDs`
Parses the JSON and compares the parsed content

### ✅ What's Not Shown?
Keys that exist in all feeds with **completely identical** values won't be shown at all.

## 🎨 Colors & Highlights

- 🔴 **Red**: Key missing in a specific feed
- 🟡 **Yellow**: Different value between feeds
- ✅ **Green**: 
  - Feed loaded successfully
  - **Success**: Feeds are completely identical (large green box)
- 🔵 **Blue**: Feed loading in progress

## 📥 Data Export

The app supports exporting results in two formats:

### JSON
```json
{
  "totalDifferences": 5,
  "feeds": [...],
  "differences": [...]
}
```

### CSV
Table with all differences, openable in Excel or Google Sheets.

## 🔍 Search & Filter

Use the search field to filter differences by key name:
- Case-insensitive search
- Real-time search
- Highlighted results

## 🛠️ Technologies

- **React 18** - UI library
- **Vite** - Fast build tool
- **TailwindCSS** - Styling
- **Lucide React** - Modern icons

## 📝 Important Notes

1. **CORS - ✅ Solved**: The app uses Vite proxy to bypass CORS issues. Requests go through `/api/` and the server forwards them to the external API
2. **Authentication**: The token in the URL template is fixed - if it expires, update it in `src/App.jsx` (`BASE_URL` constant)
3. **CD Parameters**: Each feed has its own CD parameters. This allows you to:
   - Compare the same feed ID with different locales (e.g., Japanese vs English)
   - Compare different features (e.g., recurring OOBE vs post OOBE)
   - Test different configurations of the same feed
4. **Performance**: The app handles complex JSON objects and normalizes (flattens) them for easy comparison

## 🐛 Troubleshooting

### "Failed to fetch" Error
- **Solution**: The server is already configured with proxy - just refresh the page
- If the error persists, check that the server is running (`npm run dev`)
- Check the console for more details

### Feed Won't Load (HTTP 404/500)
- Check that the Feed ID is valid
- Check your internet connection
- Check that the token is valid (update in `src/App.jsx` if needed)

### No Differences Shown
- Ensure data loaded successfully (green indicator)
- Ensure there are actual differences between the feeds
- Try refreshing the page and fetching again

## 📄 License

MIT License - Free to use and modify

---

**Version**: 1.0  
**Type**: Internal Configuration Management Tool  
**For**: Business Analyst Team Use  
**© 2025** - For internal use only
