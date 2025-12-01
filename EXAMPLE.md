# 📝 דוגמת שימוש

## דוגמאות שימוש ב-CD Parameters

**חשוב**: כל feed יכול להיות עם CD Parameters משלו!

### דוגמה 1: השוואה בין תצורות יפנית לאנגלית

**הגדרה:**
1. לחץ "Configure" תחת CD Parameters
2. הגדר:
   - Locale: `ja` (Japanese)
   - Feature: `post OOBE`
3. הזן את אותו Feed ID עם תווית "Japanese Config"
4. לחץ "Add Feed"
5. לחץ שוב "Configure" ושנה:
   - Locale: `en` (English)
   - Feature: `post OOBE` (אותו)
6. הזן את **אותו** Feed ID עם תווית "English Config"
7. לחץ "Add Feed"
8. שלוף והשווה

**תוצאה**: ההשוואה תראה הבדלים במחרוזות טקסט ואולי תצורות feeds שונות עבור שפות שונות - **אפילו מאותו Feed ID!**

### דוגמה 2: השוואה בין Features שונים

**הגדרה:**
1. הגדר CD Parameters:
   - Feature: `recurring OOBE`
   - Locale: (ריק - default)
2. הוסף Feed ID עם תווית "Recurring OOBE"
3. שנה CD Parameters:
   - Feature: `post OOBE`
   - Locale: (ריק - default)
4. הוסף **אותו** Feed ID עם תווית "Post OOBE"
5. שלוף והשווה

**תוצאה**: מראה הבדלים באילו feeds נטענים עבור שלבי OOBE שונים - מאותו Product Feed אבל עם feature שונה!

### דוגמה 3: השוואה בין Feeds שונים עם אותם Parameters

**הגדרה:**
1. הגדר CD Parameters:
   - Locale: `en`
   - Feature: `post OOBE`
2. הוסף Feed ID ראשון
3. **אל תשנה** את ה-CD Parameters
4. הוסף Feed ID שני
5. שלוף והשווה

**תוצאה**: משווה בין שני Feeds שונים באותה תצורת locale ו-feature.

---

## מבנה ה-Feed

האפליקציה מצפה ל-JSON response בפורמט הבא:

```json
{
  "properties": {
    "welcomeScreenLeaveActionLaterText": "Later",
    "userDemographicSelectionTitleText": "Hi there!",
    "welcomeScreenTitleText": "Discover and install great apps",
    "screenFeedsConfig": "[{\"shouldShowHeaders\":\"false\",\"toolbarTitleId\":\"popular\",\"screenId\":5783,\"feeds\":[\"af218581-ad6d-4895-9620-3db0f88cb977\"]}]",
    "appUnitsConfig": "{\"af218581-ad6d-4895-9620-3db0f88cb977\":\"s_i_1\"}",
    "specialOffersAppFeedGUIDs": "[]",
    "progressBarColor": "#ff0074d4",
    "continueButtonTextColor": "#ffffffff"
  }
}
```

## מה האפליקציה בודקת?

### 1. Keys חסרים או עודפים
אם ב-Feed A יש key שלא קיים ב-Feed B:
```
Feed A: "newFeatureEnabled": "true"
Feed B: ❌ חסר
```

### 2. ערכים שונים
אם לשני Feeds יש אותו key עם ערכים שונים:
```
Key: welcomeScreenTitleText
Feed A: "Discover and install great apps"
Feed B: "Install great apps"
```

### 3. הבדלים ב-screenFeedsConfig - ניתוח מתקדם

האפליקציה מתמקדת במיוחד ב-**Feed IDs** ומציגה אותם בצורה ברורה.

#### דוגמה 1: Feed IDs שונים לחלוטין
```json
Feed A:
[
  {"screenId": 15004, "feeds": ["6dc0d6bf-e046-4071-8e18-77bb9fd5effd"]},
  {"screenId": 15000, "feeds": ["bfe7bdcd-8d90-47a9-964b-ea4880b51859"]}
]

Feed B:
[
  {"screenId": 15004, "feeds": ["aaaaaaaa-1111-2222-3333-444444444444"]},
  {"screenId": 15000, "feeds": ["bbbbbbbb-5555-6666-7777-888888888888"]}
]
```
**תוצאה**: 
- 🔴 **IDs שונים לחלוטין**
- תיבה כתומה: "📊 IDs שונים לחלוטין"
- תצוגה של Feed IDs:
  ```
  Feed A:
  1. 6dc0d6bf-e046-4071-8e18-77bb9fd5effd
  2. bfe7bdcd-8d90-47a9-964b-ea4880b51859
  
  Feed B:
  1. aaaaaaaa-1111-2222-3333-444444444444
  2. bbbbbbbb-5555-6666-7777-888888888888
  ```

#### דוגמה 2: אותם Feed IDs אבל סדר שונה
```json
Feed A:
[
  {"screenId": 15004, "feeds": ["6dc0d6bf-e046-4071-8e18-77bb9fd5effd"]},
  {"screenId": 15000, "feeds": ["bfe7bdcd-8d90-47a9-964b-ea4880b51859"]}
]

Feed B:
[
  {"screenId": 15000, "feeds": ["bfe7bdcd-8d90-47a9-964b-ea4880b51859"]},
  {"screenId": 15004, "feeds": ["6dc0d6bf-e046-4071-8e18-77bb9fd5effd"]}
]
```
**תוצאה**: 
- 🟡 **אותם IDs אבל סדר שונה**
- תיבה כתומה: "⚠️ אותם Feed IDs אבל בסדר שונה"

#### דוגמה 3: כמות שונה של Feed IDs
```json
Feed A:
[
  {"screenId": 15004, "feeds": ["6dc0d6bf-e046-4071-8e18-77bb9fd5effd"]},
  {"screenId": 15000, "feeds": ["bfe7bdcd-8d90-47a9-964b-ea4880b51859"]}
]

Feed B:
[
  {"screenId": 15004, "feeds": ["6dc0d6bf-e046-4071-8e18-77bb9fd5effd"]},
  {"screenId": 15000, "feeds": ["bfe7bdcd-8d90-47a9-964b-ea4880b51859"]},
  {"screenId": 15002, "feeds": ["2ed81ed3-bcaf-4336-b034-6e762f0d5c9e"]}
]
```
**תוצאה**: 
- 🟠 **כמות שונה**
- תיבה כתומה: "⚠️ כמות שונה של Feed IDs בין ה-Feeds"
- "כמות Feed IDs: 2, 3"

### 4. הבדלים ב-appUnitsConfig

```json
Feed A: {"feed-1": "s_i_1", "feed-2": "s_i_1"}
Feed B: {"feed-1": "s_i_1", "feed-2": "s_i_2"}
```
**תוצאה**: ההשוואה תזהה שהערך של feed-2 שונה ✅

## תצוגת התוצאות

האפליקציה מציגה את ההבדלים בטבלה עם:

| Key | סוג | Feed A | Feed B |
|-----|-----|--------|--------|
| welcomeScreenTitleText | 🟡 שונה | "Discover apps" | "Install apps" |
| newFeature | 🔴 חסר | ✓ enabled | ❌ חסר |
| screenFeedsConfig | 🟡 שונה | [JSON מפורמט] | [JSON מפורמט] |

### תצוגה מיוחדת ל-JSON Configs
שדות כמו `screenFeedsConfig`, `appUnitsConfig` ו-`specialOffersAppFeedGUIDs` מוצגים בתיבת קוד מעוצבת:

```json
[
  {
    "screenId": 5783,
    "toolbarTitleId": "popular",
    "feeds": ["af218581-ad6d-4895-9620-3db0f88cb977"]
  }
]
```

## טיפים לשימוש

1. **הכן Product Feed IDs**: אסוף את ה-IDs של כל ה-feeds שאתה רוצה להשוות
2. **תייג את ה-Feeds**: תן שמות תיאוריים (לדוגמה: "Production", "Staging", "Test")
3. **שלוף את כולם**: לחץ "שלוף כל ה-Feeds" כדי לטעון את כל הנתונים
4. **השווה**: לחץ "השווה Feeds" כדי לראות את ההבדלים
5. **חפש**: השתמש בחיפוש כדי למצוא keys ספציפיים
6. **ייצא**: שמור את התוצאות ל-JSON או CSV לתיעוד

## דוגמאות ל-Feed IDs
```
db23c55b-d82e-4a3b-a4a2-f82226e5fd44
af218581-ad6d-4895-9620-3db0f88cb977
9d106c45-4ab8-4092-bdb0-e20c7930c34d
cb2d0952-5478-4a1b-ade7-f628604c7ada
```
