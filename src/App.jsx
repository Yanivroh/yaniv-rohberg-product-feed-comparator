import React, { useState } from 'react'
import { Plus, Trash2, Download, Search, AlertCircle, Loader2, X, Settings } from 'lucide-react'
import { cn } from './lib/utils'

const BASE_URL = '/api/feeds/{PRODUCT_FEED_ID}?tk=8490e6bcea9089cf9eb38bedfaae39f20d6b76b953f60f41db974ee0866cdeb7&x-cc=US&debug=true&segment=true'

const LOCALES = {
  "en": "English", "es": "Spanish", "fr": "French", "de": "German",
  "it": "Italian", "pt": "Portuguese", "nl": "Dutch", "sv": "Swedish",
  "no": "Norwegian", "da": "Danish", "fi": "Finnish", "is": "Icelandic",
  "ja": "Japanese", "zh": "Chinese", "ko": "Korean", "ar": "Arabic",
  "he": "Hebrew", "ru": "Russian", "pl": "Polish", "cs": "Czech",
  "hu": "Hungarian", "tr": "Turkish", "el": "Greek", "hi": "Hindi",
  "id": "Indonesian", "ms": "Malay", "th": "Thai", "vi": "Vietnamese"
}

const FEATURES = [
  "recurring OOBE",
  "post OOBE",
  "reef",
  "gotw"
]

function App() {
  const [feeds, setFeeds] = useState([])
  const [newFeedId, setNewFeedId] = useState('')
  const [newFeedLabel, setNewFeedLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [differences, setDifferences] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [hasCompared, setHasCompared] = useState(false)
  
  // CD Parameters for new feed
  const [newFeedCdParams, setNewFeedCdParams] = useState({
    l: '',      // locale
    sis: '',    // boolean
    rt: '',     // boolean
    af: '',     // feature
    src: ''     // source
  })
  const [showCdConfig, setShowCdConfig] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState([])

  // Build URL with CD parameters
  const buildFeedUrl = (feedId, cdParams = {}) => {
    console.log('Building URL for Feed ID:', feedId)
    console.log('CD Params:', cdParams)
    
    let url = BASE_URL.replace('{PRODUCT_FEED_ID}', feedId)
    
    // Build CD object only with non-empty values
    const cd = {}
    if (cdParams.l) cd.l = cdParams.l
    if (cdParams.sis !== '') cd.sis = cdParams.sis === 'true'
    if (cdParams.rt !== '') cd.rt = cdParams.rt === 'true'
    if (cdParams.af) cd.af = cdParams.af
    if (cdParams.src) cd.src = cdParams.src
    
    // Always add cd parameter, even if empty
    const cdString = JSON.stringify(cd)
    const encoded = encodeURIComponent(cdString)
    url += `&cd=${encoded}`
    
    console.log('CD String:', cdString)
    console.log('Encoded CD:', encoded)
    console.log('Final Built URL:', url)
    console.log('Full URL with domain:', 'https://ape-androids.isappcloud.com' + url.replace('/api', ''))
    return url
  }

  const addFeed = () => {
    if (!newFeedId.trim()) return
    
    const label = newFeedLabel.trim() || `Feed ${feeds.length + 1}`
    setFeeds([...feeds, {
      id: Date.now(),
      feedId: newFeedId.trim(),
      label,
      data: null,
      error: null,
      loading: false,
      cdParams: {...newFeedCdParams}  // Save CD params with the feed
    }])
    setNewFeedId('')
    setNewFeedLabel('')
    setHasCompared(false)
  }

  const removeFeed = (id) => {
    setFeeds(feeds.filter(f => f.id !== id))
    setDifferences([])
    setHasCompared(false)
  }

  const updateFeedLabel = (id, newLabel) => {
    setFeeds(feeds.map(f => f.id === id ? { ...f, label: newLabel } : f))
  }

  const fetchFeed = async (feed) => {
    const url = buildFeedUrl(feed.feedId, feed.cdParams || {})
    const fullUrl = 'https://ape-androids.isappcloud.com' + url.replace('/api', '')
    const timestamp = new Date().toLocaleTimeString()
    
    // Add to debug info
    const debugEntry = {
      timestamp,
      feedId: feed.feedId,
      label: feed.label,
      url: url,
      fullUrl: fullUrl,
      cdParams: feed.cdParams || {},
      status: 'Loading...'
    }
    setDebugInfo(prev => [debugEntry, ...prev])
    
    setFeeds(prevFeeds => prevFeeds.map(f => 
      f.id === feed.id ? { ...f, loading: true, error: null } : f
    ))

    try {
      console.log(`Fetching feed ${feed.feedId} from:`, url)
      const response = await fetch(url)
      
      // Update debug with response
      setDebugInfo(prev => prev.map(d => 
        d.timestamp === timestamp && d.feedId === feed.feedId
          ? { ...d, status: `${response.status} ${response.statusText}`, success: response.ok }
          : d
      ))
      
      // Auto-open debug on error
      if (!response.ok) {
        setShowDebug(true)
        const errorText = await response.text()
        console.error(`HTTP ${response.status} Error:`, errorText)
        
        // Update debug with error details
        setDebugInfo(prev => prev.map(d => 
          d.timestamp === timestamp && d.feedId === feed.feedId
            ? { ...d, errorDetails: errorText.substring(0, 500) }
            : d
        ))
        
        throw new Error(`HTTP ${response.status} - ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`Successfully fetched feed ${feed.feedId}`)
      
      setFeeds(prevFeeds => prevFeeds.map(f => 
        f.id === feed.id ? { ...f, data, loading: false } : f
      ))
    } catch (error) {
      console.error(`Error fetching feed ${feed.feedId}:`, error)
      setShowDebug(true) // Auto-open debug on error
      
      // Update debug with error
      setDebugInfo(prev => prev.map(d => 
        d.timestamp === timestamp && d.feedId === feed.feedId
          ? { ...d, status: `Error: ${error.message}`, success: false }
          : d
      ))
      
      setFeeds(prevFeeds => prevFeeds.map(f => 
        f.id === feed.id ? { 
          ...f, 
          error: error.message, 
          loading: false 
        } : f
      ))
    }
  }

  const fetchAllFeeds = async () => {
    setLoading(true)
    setHasCompared(false) // Reset comparison when fetching new data
    await Promise.all(feeds.map(feed => fetchFeed(feed)))
    setLoading(false)
  }

  // Parse embedded JSON strings (like screenFeedsConfig, appUnitsConfig)
  const parseEmbeddedJSON = (value) => {
    if (typeof value !== 'string') return value
    
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  // Extract feed IDs and order from screenFeedsConfig
  const extractFeedOrder = (screenFeedsConfig) => {
    try {
      const parsed = typeof screenFeedsConfig === 'string' 
        ? JSON.parse(screenFeedsConfig) 
        : screenFeedsConfig
      
      if (Array.isArray(parsed)) {
        return parsed.map(screen => ({
          screenId: screen.screenId,
          toolbarTitleId: screen.toolbarTitleId,
          feeds: screen.feeds || []
        }))
      }
      return parsed
    } catch {
      return screenFeedsConfig
    }
  }

  // Extract only feed IDs as a flat list (for focused comparison)
  const extractFeedIDs = (screenFeedsConfig) => {
    try {
      const parsed = typeof screenFeedsConfig === 'string' 
        ? JSON.parse(screenFeedsConfig) 
        : screenFeedsConfig
      
      if (Array.isArray(parsed)) {
        const feedIds = []
        parsed.forEach(screen => {
          if (screen.feeds && Array.isArray(screen.feeds)) {
            feedIds.push(...screen.feeds)
          }
        })
        return feedIds
      }
      return []
    } catch {
      return []
    }
  }

  // Compare feed IDs in detail
  const compareFeedIDs = (feedOrders) => {
    const allFeedIds = feedOrders.map(order => extractFeedIDs(order))
    
    // Check if all have same length
    const lengths = allFeedIds.map(ids => ids.length)
    const sameLengths = lengths.every(len => len === lengths[0])
    
    // Check if all have same IDs in same order
    const sameOrder = allFeedIds.every(ids => 
      JSON.stringify(ids) === JSON.stringify(allFeedIds[0])
    )
    
    // Check if all have same IDs but maybe different order
    const sameIDs = allFeedIds.every(ids => {
      const sorted1 = [...ids].sort()
      const sorted0 = [...allFeedIds[0]].sort()
      return JSON.stringify(sorted1) === JSON.stringify(sorted0)
    })
    
    return {
      sameLengths,
      sameOrder,
      sameIDs,
      feedIds: allFeedIds,
      summary: !sameOrder ? (
        !sameIDs ? 'Completely different IDs' :
        !sameLengths ? 'Same IDs but different count' :
        'Same IDs but different order'
      ) : null
    }
  }

  const compareFeeds = () => {
    console.log('compareFeeds called!')
    const feedsWithData = feeds.filter(f => f.data && !f.error)
    console.log('Feeds with data:', feedsWithData.length)
    
    if (feedsWithData.length < 2) {
      alert('At least 2 feeds with valid data are required for comparison')
      return
    }

    // Extract only properties from each feed
    const propertiesFeeds = feedsWithData.map(feed => ({
      ...feed,
      properties: feed.data.properties || feed.data
    }))
    console.log('Properties feeds:', propertiesFeeds)

    const allKeys = new Set()
    propertiesFeeds.forEach(feed => {
      Object.keys(feed.properties).forEach(key => allKeys.add(key))
    })

    const diffs = []

    allKeys.forEach(key => {
      const values = propertiesFeeds.map(feed => ({
        feedId: feed.id,
        label: feed.label,
        value: feed.properties[key],
        exists: key in feed.properties
      }))

      const allExist = values.every(v => v.exists)
      
      // Special handling for JSON configs
      let allSame = false
      let detailedDiff = null
      
      if (allExist) {
        if (key === 'screenFeedsConfig') {
          // Compare feed order and configuration with detailed analysis
          const feedOrders = values.map(v => v.value)
          const feedComparison = compareFeedIDs(feedOrders)
          allSame = feedComparison.sameOrder
          
          if (!allSame) {
            detailedDiff = {
              type: 'feedOrder',
              feedComparison,
              fullData: feedOrders.map(order => extractFeedOrder(order))
            }
          }
        } else if (key === 'appUnitsConfig' || key === 'specialOffersAppFeedGUIDs') {
          // Parse and compare JSON configs
          const parsedValues = values.map(v => parseEmbeddedJSON(v.value))
          allSame = parsedValues.every(parsed => 
            JSON.stringify(parsed) === JSON.stringify(parsedValues[0])
          )
        } else {
          // Regular comparison
          allSame = values.every(v => 
            JSON.stringify(v.value) === JSON.stringify(values[0].value)
          )
        }
      }

      if (!allSame) {
        diffs.push({
          key,
          values,
          type: !allExist ? 'missing' : 'different',
          detailedDiff
        })
      }
    })

    console.log('Total differences found:', diffs.length)
    setDifferences(diffs)
    setHasCompared(true)
    
    // Show success message if no differences
    if (diffs.length === 0) {
      alert('✅ Feeds are identical! No differences found in properties.')
    }
  }

  const formatValue = (value, key = '') => {
    if (value === undefined) return '—'
    if (value === null) return 'null'
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    
    // Special formatting for JSON configs
    if (key === 'screenFeedsConfig' || key === 'appUnitsConfig' || key === 'specialOffersAppFeedGUIDs') {
      try {
        const parsed = parseEmbeddedJSON(value)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return String(value)
      }
    }
    
    if (typeof value === 'object') return JSON.stringify(value)
    
    // Truncate very long strings for display
    const strValue = String(value)
    if (strValue.length > 100) {
      return strValue.substring(0, 100) + '...'
    }
    return strValue
  }

  const exportToJSON = () => {
    const exportData = {
      totalDifferences: differences.length,
      feeds: feeds.map(f => ({ id: f.feedId, label: f.label })),
      differences: differences.map(diff => ({
        key: diff.key,
        type: diff.type,
        values: diff.values.reduce((acc, v) => {
          acc[v.label] = v.exists ? formatValue(v.value) : 'חסר'
          return acc
        }, {})
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feed-comparison-${Date.now()}.json`
    a.click()
  }

  const exportToCSV = () => {
    const headers = ['Key', 'Type', ...feeds.map(f => f.label)]
    const rows = differences.map(diff => [
      diff.key,
      diff.type === 'missing' ? 'חסר' : 'שונה',
      ...diff.values.map(v => v.exists ? formatValue(v.value) : 'חסר')
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feed-comparison-${Date.now()}.csv`
    a.click()
  }

  const filteredDifferences = differences.filter(diff =>
    diff.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8" dir="ltr">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6 border-l-4 border-blue-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🔍</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Product Feed Comparator
              </h1>
              <p className="text-sm text-blue-600 font-medium">Internal Configuration Tool</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Compare and analyze differences between product feed configurations
          </p>
        </div>

        {/* Add Feed Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" />
            Add Product Feed
          </h2>

          {/* CD Parameters Configuration */}
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Settings size={16} className="text-purple-600" />
                Context Data (CD) Parameters
                <span className="text-xs font-normal text-gray-500">(Optional for this feed)</span>
                {Object.values(newFeedCdParams).some(v => v !== '') && (
                  <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                    Set
                  </span>
                )}
              </h3>
              <button
                onClick={() => setShowCdConfig(!showCdConfig)}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                {showCdConfig ? 'Hide' : 'Configure'}
              </button>
            </div>
            
            {showCdConfig && (
              <div className="space-y-3 pt-3 border-t border-purple-200">
                <p className="text-xs text-gray-600">
                  These parameters will be applied to this specific feed. Leave empty for default values.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Locale */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Locale (l)
                    </label>
                    <select
                      value={newFeedCdParams.l}
                      onChange={(e) => setNewFeedCdParams({...newFeedCdParams, l: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">-- Default --</option>
                      {Object.entries(LOCALES).map(([code, name]) => (
                        <option key={code} value={code}>{name} ({code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Feature */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Feature (af)
                    </label>
                    <select
                      value={newFeedCdParams.af}
                      onChange={(e) => setNewFeedCdParams({...newFeedCdParams, af: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">-- Default --</option>
                      {FEATURES.map(feature => (
                        <option key={feature} value={feature}>{feature}</option>
                      ))}
                    </select>
                  </div>

                  {/* Source */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Source (src)
                    </label>
                    <input
                      type="text"
                      value={newFeedCdParams.src}
                      onChange={(e) => setNewFeedCdParams({...newFeedCdParams, src: e.target.value})}
                      placeholder="e.g., FOTA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* SIS */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      SIS (sis)
                    </label>
                    <select
                      value={newFeedCdParams.sis}
                      onChange={(e) => setNewFeedCdParams({...newFeedCdParams, sis: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">-- Default --</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </div>

                  {/* RT */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      RT (rt)
                    </label>
                    <select
                      value={newFeedCdParams.rt}
                      onChange={(e) => setNewFeedCdParams({...newFeedCdParams, rt: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">-- Default --</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </div>
                </div>

                {/* Preview */}
                {Object.values(newFeedCdParams).some(v => v !== '') && (
                  <div className="mt-3 p-2 bg-white rounded border border-purple-200">
                    <p className="text-xs font-medium text-purple-800 mb-1">Preview:</p>
                    <pre className="text-xs font-mono text-purple-900">
                      {JSON.stringify(
                        Object.entries(newFeedCdParams).reduce((acc, [key, value]) => {
                          if (value !== '') {
                            acc[key] = key === 'sis' || key === 'rt' ? value === 'true' : value;
                          }
                          return acc;
                        }, {}),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}

                <button
                  onClick={() => setNewFeedCdParams({l: '', sis: '', rt: '', af: '', src: ''})}
                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                >
                  Reset Parameters
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Product Feed ID (e.g., db23c55b-d82e-4a3b-a4a2...)"
              value={newFeedId}
              onChange={(e) => setNewFeedId(e.target.value)}
              className="flex-1 min-w-[300px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addFeed()}
            />
            <input
              type="text"
              placeholder="Label (optional)"
              value={newFeedLabel}
              onChange={(e) => setNewFeedLabel(e.target.value)}
              className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addFeed()}
            />
            <button
              onClick={addFeed}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm"
            >
              <Plus size={18} />
              Add Feed
            </button>
          </div>
        </div>

        {/* Feeds List */}
        {feeds.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Feeds ({feeds.length})
              </h2>
              <button
                onClick={fetchAllFeeds}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Fetch All Feeds'
                )}
              </button>
            </div>

            <div className="space-y-3">
              {feeds.map(feed => (
                <div
                  key={feed.id}
                  className={cn(
                    "border rounded-lg p-4 transition-all",
                    feed.error ? "border-red-300 bg-red-50" : 
                    feed.data ? "border-green-300 bg-green-50" :
                    "border-gray-200 bg-gray-50"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={feed.label}
                        onChange={(e) => updateFeedLabel(feed.id, e.target.value)}
                        className="font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-2 py-1"
                      />
                      <span className="text-sm text-gray-500 flex-1 font-mono truncate">
                        {feed.feedId}
                      </span>
                      
                      {feed.loading && (
                        <Loader2 size={20} className="text-blue-600 animate-spin" />
                      )}
                      
                      {feed.data && (
                        <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Loaded Successfully
                        </span>
                      )}
                      
                      {feed.error && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle size={16} />
                            <span>Error: {feed.error}</span>
                          </div>
                          {feed.error.includes('404') && (
                            <div className="text-xs text-red-500 ml-6">
                              💡 Check: Feed ID valid? Token expired? (see console for full URL)
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => removeFeed(feed.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    {/* Show CD Parameters if any are set */}
                    {feed.cdParams && Object.values(feed.cdParams).some(v => v !== '') && (
                      <div className="ml-2 pl-4 border-l-2 border-purple-300">
                        <div className="flex items-center gap-2 text-xs text-purple-700">
                          <Settings size={12} />
                          <span className="font-medium">CD Parameters:</span>
                          {feed.cdParams.l && <span className="px-2 py-0.5 bg-purple-100 rounded">Locale: {feed.cdParams.l}</span>}
                          {feed.cdParams.af && <span className="px-2 py-0.5 bg-purple-100 rounded">Feature: {feed.cdParams.af}</span>}
                          {feed.cdParams.src && <span className="px-2 py-0.5 bg-purple-100 rounded">Source: {feed.cdParams.src}</span>}
                          {feed.cdParams.sis !== '' && <span className="px-2 py-0.5 bg-purple-100 rounded">SIS: {feed.cdParams.sis}</span>}
                          {feed.cdParams.rt !== '' && <span className="px-2 py-0.5 bg-purple-100 rounded">RT: {feed.cdParams.rt}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {feeds.filter(f => f.data && !f.error).length >= 2 && (
              <button
                onClick={compareFeeds}
                className="mt-4 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-base shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  🔍 Compare Feeds & Show Differences
                </span>
              </button>
            )}
          </div>
        )}

        {/* Debug Panel */}
        {debugInfo.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🔧</span>
                <span>Request Debug Log</span>
                <span className="text-sm font-normal text-gray-500">({debugInfo.length} requests)</span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {showDebug ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => setDebugInfo([])}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {showDebug && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "border rounded-lg p-4 text-sm",
                      info.success === true ? "border-green-300 bg-green-50" :
                      info.success === false ? "border-red-300 bg-red-50" :
                      "border-gray-300 bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{info.label}</span>
                        <span className="text-xs text-gray-500">{info.timestamp}</span>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        info.success === true ? "bg-green-200 text-green-800" :
                        info.success === false ? "bg-red-200 text-red-800" :
                        "bg-gray-200 text-gray-800"
                      )}>
                        {info.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold text-gray-700">Feed ID:</span>
                        <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{info.feedId}</code>
                      </div>

                      {Object.keys(info.cdParams).some(k => info.cdParams[k] !== '') && (
                        <div>
                          <span className="font-semibold text-gray-700">CD Parameters:</span>
                          <pre className="mt-1 text-xs bg-purple-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(info.cdParams, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div>
                        <span className="font-semibold text-gray-700">Proxy URL:</span>
                        <code className="block mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto break-all">
                          {info.url}
                        </code>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Full External URL:</span>
                        <code className="block mt-1 text-xs bg-blue-50 p-2 rounded overflow-x-auto break-all">
                          {info.fullUrl}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(info.fullUrl)
                            alert('URL copied to clipboard!')
                          }}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          📋 Copy URL
                        </button>
                      </div>

                      {info.errorDetails && (
                        <div>
                          <span className="font-semibold text-red-700">Error Details:</span>
                          <pre className="mt-1 text-xs bg-red-50 p-2 rounded overflow-x-auto max-h-32">
                            {info.errorDetails}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Differences Display */}
        {differences.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                <span>{differences.length} Difference{differences.length !== 1 ? 's' : ''} Found</span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={exportToJSON}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download size={18} />
                  JSON
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download size={18} />
                  CSV
                </button>
              </div>
            </div>

            {/* Feed IDs Summary (if screenFeedsConfig differs) */}
            {filteredDifferences.some(d => d.key === 'screenFeedsConfig' && d.detailedDiff?.feedComparison) && (
              <div className="mb-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">🔄</span>
                  Feed IDs Analysis
                </h3>
                {filteredDifferences
                  .filter(d => d.key === 'screenFeedsConfig' && d.detailedDiff?.feedComparison)
                  .map((diff, idx) => {
                    const comparison = diff.detailedDiff.feedComparison
                    return (
                      <div key={idx} className="text-orange-900">
                        <p className="font-semibold mb-1">
                          📊 {comparison.summary}
                        </p>
                        <div className="text-sm space-y-1">
                          <p>• Feed ID Count: {comparison.feedIds.map(ids => ids.length).join(', ')}</p>
                          {!comparison.sameLengths && (
                            <p className="text-red-700 font-medium">⚠️ Different number of Feed IDs between feeds</p>
                          )}
                          {comparison.sameIDs && !comparison.sameOrder && (
                            <p className="text-yellow-700 font-medium">⚠️ Same Feed IDs but in different order</p>
                          )}
                          {!comparison.sameIDs && (
                            <p className="text-red-700 font-medium">⚠️ Completely different Feed IDs</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Differences Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                      Key
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                      Type
                    </th>
                    {feeds.filter(f => f.data).map(feed => (
                      <th
                        key={feed.id}
                        className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700"
                      >
                        {feed.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDifferences.map((diff, index) => (
                    <tr
                      key={index}
                      className={cn(
                        "hover:bg-gray-50 transition-colors",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      )}
                    >
                      <td className="border border-gray-300 px-4 py-3 font-mono text-sm text-gray-800 text-left">
                        {diff.key}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {diff.type === 'missing' ? (
                          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            🔴 Missing
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            🟡 Different
                          </span>
                        )}
                      </td>
                      {diff.values.map((v, vIndex) => (
                        <td
                          key={vIndex}
                          className={cn(
                            "border border-gray-300 px-4 py-3",
                            !v.exists ? "bg-red-50 text-red-700" : 
                            diff.type === 'different' ? "bg-yellow-50" : ""
                          )}
                        >
                          {v.exists ? (
                            <div className="text-left">
                              {diff.key === 'screenFeedsConfig' && diff.detailedDiff?.feedComparison ? (
                                <div className="space-y-3">
                                  {/* Feed IDs Only - Clean Display */}
                                  <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                                    <div className="font-bold text-blue-900 mb-3 text-base flex items-center gap-2">
                                      <span>🎯</span>
                                      <span>Feed IDs</span>
                                      <span className="text-sm font-normal text-gray-600">({diff.detailedDiff.feedComparison.feedIds[vIndex].length} feeds)</span>
                                    </div>
                                    <div className="space-y-2">
                                      {diff.detailedDiff.feedComparison.feedIds[vIndex].map((feedId, idx) => (
                                        <div key={idx} className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                            {idx + 1}
                                          </div>
                                          <div className="flex-1 font-mono text-sm break-all pt-1">
                                            {feedId}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {/* Full JSON (collapsed) */}
                                  <details className="cursor-pointer">
                                    <summary className="text-xs text-gray-500 hover:text-gray-700 select-none underline">
                                      👁️ Show additional info (screenId, toolbarTitleId, etc.)
                                    </summary>
                                    <pre className="font-mono text-xs whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-900 text-green-400 p-3 rounded mt-2">
                                      {formatValue(v.value, diff.key)}
                                    </pre>
                                  </details>
                                </div>
                              ) : (diff.key === 'appUnitsConfig' || diff.key === 'specialOffersAppFeedGUIDs') ? (
                                <pre className="font-mono text-xs whitespace-pre-wrap max-h-60 overflow-y-auto bg-gray-900 text-green-400 p-3 rounded">
                                  {formatValue(v.value, diff.key)}
                                </pre>
                              ) : (
                                <span className="font-mono text-sm break-words">
                                  {formatValue(v.value, diff.key)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-red-600 font-semibold text-sm">
                                ❌ Missing
                              </span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDifferences.length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-500">
                No results found for "{searchTerm}"
              </div>
            )}
          </div>
        )}

        {/* Success message when feeds are identical */}
        {hasCompared && differences.length === 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-8 text-center shadow-lg">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Feeds are Identical!
            </h2>
            <p className="text-green-700 text-lg">
              No differences found in the properties of the compared feeds.
            </p>
            <p className="text-green-600 text-sm mt-2">
              All keys and values are identical across all feeds.
            </p>
          </div>
        )}

        {/* Instruction message before comparison */}
        {!hasCompared && differences.length === 0 && feeds.length >= 2 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
            <p className="text-blue-800 text-base">
              💡 <strong>Next Steps:</strong> Add at least 2 feeds, click "Fetch All Feeds", then "Compare Feeds & Show Differences"
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <div className="bg-white rounded-lg shadow-sm p-4 border-t-2 border-blue-600">
            <p className="font-medium text-gray-700">Product Feed Comparator v1.0</p>
            <p className="text-xs mt-1">Internal Configuration Management Tool</p>
            <p className="text-xs text-gray-400 mt-2">© 2025 Business Analyst Team | For internal use only</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
