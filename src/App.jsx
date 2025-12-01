import React, { useState } from 'react'
import { Plus, Trash2, Download, Search, AlertCircle, Loader2, X, Settings } from 'lucide-react'
import { cn } from './lib/utils'

// Environment configurations
const ENVIRONMENTS = {
  android: {
    name: 'Android',
    domain: 'https://ape-androids.isappcloud.com',
    proxyPath: '/api-android',
    token: '8490e6bcea9089cf9eb38bedfaae39f20d6b76b953f60f41db974ee0866cdeb7'
  },
  hutch: {
    name: 'Hutch',
    domain: 'https://ape-hutch.isappcloud.com',
    proxyPath: '/api-hutch',
    token: '5d46d76603b11f820e2aa2fc6815c9cf7b15c62354dc3004e6e2b730c4a7fa0d'
  },
  sprint: {
    name: 'Sprint',
    domain: 'https://ape-sprint.isappcloud.com',
    proxyPath: '/api-sprint',
    token: '277f99dae24a27a21abf1d1fd7c0637d4b47f3101898ec481970bf5d1c68a58b'
  }
}

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
  const [selectedEnvironment, setSelectedEnvironment] = useState('android')
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
  
  // CD Parameters editing dialog
  const [cdConfigFeed, setCdConfigFeed] = useState(null) // Feed ID being edited
  const [editCdParams, setEditCdParams] = useState({
    l: '',
    sis: '',
    rt: '',
    af: '',
    src: ''
  })
  const [showCdConfig, setShowCdConfig] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState([])
  
  // CD Local Iteration Loop
  const [isLoopRunning, setIsLoopRunning] = useState(false)
  const [loopResults, setLoopResults] = useState([])
  const [showLoopResults, setShowLoopResults] = useState(false)

  // Build URL with CD parameters
  const buildFeedUrl = (feedId, cdParams = {}) => {
    const env = ENVIRONMENTS[selectedEnvironment]
    
    console.log('Building URL for Feed ID:', feedId)
    console.log('Environment:', env.name)
    console.log('CD Params:', cdParams)
    
    // Build the URL path using the proxy path
    let url = `${env.proxyPath}/feeds/${feedId}?tk=${env.token}&x-cc=US&debug=true&segment=true`
    
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
    console.log('Proxy URL:', url)
    console.log('Will proxy to:', env.domain + url.replace(env.proxyPath, ''))
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

  // Save CD Parameters changes and refetch the feed
  const saveCdParametersAndRefetch = async () => {
    if (!cdConfigFeed) return
    
    const feed = feeds.find(f => f.id === cdConfigFeed)
    if (!feed) return
    
    // Update the feed's CD parameters
    const updatedFeed = { ...feed, cdParams: editCdParams }
    setFeeds(feeds.map(f => 
      f.id === cdConfigFeed ? updatedFeed : f
    ))
    
    // Close the dialog
    setCdConfigFeed(null)
    
    // Refetch this specific feed
    await fetchFeed(updatedFeed)
  }

  const fetchFeed = async (feed) => {
    const env = ENVIRONMENTS[selectedEnvironment]
    const url = buildFeedUrl(feed.feedId, feed.cdParams || {})
    const fullUrl = env.domain + url.replace(env.proxyPath, '')
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
      console.log(`Fetching feed ${feed.feedId} from proxy:`, url)
      console.log(`Will be proxied to:`, fullUrl)
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

  // No longer needed - we now compare feeds array directly

  const compareFeeds = () => {
    console.log('compareFeeds called!')
    const feedsWithData = feeds.filter(f => f.data && !f.error)
    console.log('Feeds with data:', feedsWithData.length)
    
    if (feedsWithData.length < 2) {
      alert('At least 2 feeds with valid data are required for comparison')
      return
    }

    const diffs = []

    // Get all feeds arrays
    const feedsArrays = feedsWithData.map(feed => ({
      label: feed.label,
      productFeedId: feed.id,
      feedsArray: feed.data.feeds || []
    }))

    console.log('Feeds arrays:', feedsArrays)

    // Step 0: Compare top-level properties (data.properties) first
    const topLevelProperties = feedsWithData.map(feed => ({
      label: feed.label,
      properties: feed.data.properties || {}
    }))

    if (topLevelProperties.length > 0 && Object.keys(topLevelProperties[0].properties).length > 0) {
      const allTopKeys = new Set()
      topLevelProperties.forEach(feed => {
        Object.keys(feed.properties).forEach(key => allTopKeys.add(key))
      })

      allTopKeys.forEach(key => {
        // Skip screenFeedsConfig - we compare feeds directly
        if (key === 'screenFeedsConfig') return

        const values = topLevelProperties.map(feed => ({
          label: feed.label,
          value: feed.properties[key],
          exists: key in feed.properties
        }))

        const allExist = values.every(v => v.exists)
        const allSame = allExist && values.every(v => 
          JSON.stringify(v.value) === JSON.stringify(values[0].value)
        )

        if (!allSame) {
          diffs.push({
            key: `[Product Feed] ${key}`,
            propertyKey: key,
            values: values,
            type: !allExist ? 'missing' : 'different',
            isTopLevel: true
          })
        }
      })
    }

    // Step 1: Create Feeds Summary row
    const feedsListData = feedsArrays.map(productFeed => {
      const feedIds = productFeed.feedsArray.map(f => f.id)
      return {
        label: productFeed.label,
        feedIds: feedIds,
        count: feedIds.length
      }
    })

    // Check if feed lists are identical
    const firstFeedIds = feedsListData[0].feedIds
    const allSameOrder = feedsListData.every(f => 
      JSON.stringify(f.feedIds) === JSON.stringify(firstFeedIds)
    )
    const allSameIds = feedsListData.every(f => {
      const sorted1 = [...f.feedIds].sort()
      const sorted0 = [...firstFeedIds].sort()
      return JSON.stringify(sorted1) === JSON.stringify(sorted0)
    })
    const allSameCount = feedsListData.every(f => f.count === firstFeedIds.length)

    // Add summary row
    diffs.push({
      key: '📋 Feeds List Summary',
      isSummary: true,
      summaryData: {
        feedsListData,
        allSameOrder,
        allSameIds,
        allSameCount
      },
      values: feedsListData.map(f => ({
        label: f.label,
        value: f.feedIds,
        count: f.count,
        exists: true
      })),
      type: allSameOrder ? 'same' : 'different'
    })

    // Step 2: Compare properties for feeds that exist in ALL product feeds
    const allFeedIds = new Set()
    feedsArrays.forEach(productFeed => {
      productFeed.feedsArray.forEach(innerFeed => {
        allFeedIds.add(innerFeed.id)
      })
    })

    allFeedIds.forEach(feedId => {
      // Find this feed in each product feed
      const feedsData = feedsArrays.map(productFeed => {
        const foundFeed = productFeed.feedsArray.find(f => f.id === feedId)
        return {
          productFeedLabel: productFeed.label,
          exists: !!foundFeed,
          feed: foundFeed,
          index: foundFeed ? productFeed.feedsArray.findIndex(f => f.id === feedId) : -1
        }
      })

      const allExist = feedsData.every(f => f.exists)

      // Only compare properties if feed exists in ALL product feeds
      if (allExist) {
        const allPropertiesKeys = new Set()
        
        feedsData.forEach(f => {
          Object.keys(f.feed.properties || {}).forEach(key => allPropertiesKeys.add(key))
        })

        allPropertiesKeys.forEach(propKey => {
          const propValues = feedsData.map(f => ({
            label: f.productFeedLabel,
            value: f.feed.properties?.[propKey],
            exists: propKey in (f.feed.properties || {}),
            feedIndex: f.index
          }))

          const allPropExist = propValues.every(v => v.exists)
          const allPropSame = allPropExist && propValues.every(v => 
            JSON.stringify(v.value) === JSON.stringify(propValues[0].value)
          )

          if (!allPropSame) {
            diffs.push({
              key: `Feed #${propValues[0].feedIndex + 1} (${feedId}) → ${propKey}`,
              feedId: feedId,
              propertyKey: propKey,
              feedIndex: propValues[0].feedIndex,
              values: propValues,
              type: !allPropExist ? 'missing' : 'different',
              isFeedProperty: true
            })
          }
        })
      }
    })

    console.log('Total differences found:', diffs.length)
    setDifferences(diffs)
    setHasCompared(true)
    
    // Show success message if no differences
    if (diffs.length === 0) {
      alert('✅ Feeds are identical! No differences found.')
    }
  }

  // CD Local Iteration Loop - Test all locales automatically
  const runLocalIterationLoop = async () => {
    // Validation: Need at least 2 feeds
    if (feeds.length < 2) {
      alert('⚠️ Please add at least 2 feeds to run the Local Iteration Loop.')
      return
    }

    setIsLoopRunning(true)
    setLoopResults([])
    setShowLoopResults(true)
    const results = []

    // Get the first 2 feeds
    const feed1 = feeds[0]
    const feed2 = feeds[1]

    console.log('Starting CD Local Iteration Loop...')
    console.log(`Testing ${Object.keys(LOCALES).length} locales`)
    console.log(`Feed 1: ${feed1.feedId} (${feed1.label})`)
    console.log(`Feed 2: ${feed2.feedId} (${feed2.label})`)

    // Iterate through all locales
    for (const [localeCode, localeName] of Object.entries(LOCALES)) {
      console.log(`\n--- Testing locale: ${localeName} (${localeCode}) ---`)
      
      try {
        // Update CD parameters for both feeds with current locale
        const updatedFeed1 = {
          ...feed1,
          cdParams: { ...feed1.cdParams, l: localeCode }
        }
        const updatedFeed2 = {
          ...feed2,
          cdParams: { ...feed2.cdParams, l: localeCode }
        }

        // Fetch both feeds with the new locale
        const [data1, data2] = await Promise.all([
          fetchFeedData(updatedFeed1),
          fetchFeedData(updatedFeed2)
        ])

        // Compare the feeds
        const localeDiffs = compareFeedsData([
          { ...updatedFeed1, data: data1 },
          { ...updatedFeed2, data: data2 }
        ])

        // Store results
        const result = {
          locale: localeCode,
          localeName: localeName,
          differencesCount: localeDiffs.length,
          differences: localeDiffs,
          success: true
        }
        results.push(result)
        
        // Update UI with current progress
        setLoopResults([...results])

        console.log(`✓ ${localeName}: ${localeDiffs.length} differences found`)
      } catch (error) {
        console.error(`✗ ${localeName}: Error - ${error.message}`)
        const result = {
          locale: localeCode,
          localeName: localeName,
          error: error.message,
          success: false
        }
        results.push(result)
        
        // Update UI with current progress
        setLoopResults([...results])
      }
    }

    setLoopResults(results)
    setShowLoopResults(true)
    setIsLoopRunning(false)
    console.log('\n=== CD Local Iteration Loop Complete ===')
    console.log(`Total locales tested: ${results.length}`)
    console.log(`Successful: ${results.filter(r => r.success).length}`)
    console.log(`Errors: ${results.filter(r => !r.success).length}`)
  }

  // Helper: Fetch feed data and return the data object
  const fetchFeedData = async (feed) => {
    const url = buildFeedUrl(feed.feedId, feed.cdParams || {})
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`)
    }
    
    return await response.json()
  }

  // Helper: Compare feeds data (similar to compareFeeds but returns diffs)
  const compareFeedsData = (feedsWithData) => {
    const diffs = []

    const feedsArrays = feedsWithData.map(feed => ({
      label: feed.label,
      productFeedId: feed.id,
      feedsArray: feed.data.feeds || []
    }))

    // Step 0: Compare top-level properties
    const topLevelProperties = feedsWithData.map(feed => ({
      label: feed.label,
      properties: feed.data.properties || {}
    }))

    if (topLevelProperties.length > 0 && Object.keys(topLevelProperties[0].properties).length > 0) {
      const allTopKeys = new Set()
      topLevelProperties.forEach(feed => {
        Object.keys(feed.properties).forEach(key => allTopKeys.add(key))
      })

      allTopKeys.forEach(key => {
        if (key === 'screenFeedsConfig') return

        const values = topLevelProperties.map(feed => ({
          label: feed.label,
          value: feed.properties[key],
          exists: key in feed.properties
        }))

        const allExist = values.every(v => v.exists)
        const allSame = allExist && values.every(v => 
          JSON.stringify(v.value) === JSON.stringify(values[0].value)
        )

        if (!allSame) {
          diffs.push({
            key: `[Product Feed] ${key}`,
            propertyKey: key,
            values: values,
            type: !allExist ? 'missing' : 'different',
            isTopLevel: true
          })
        }
      })
    }

    // Step 2: Compare properties for feeds that exist in ALL product feeds
    const allFeedIds = new Set()
    feedsArrays.forEach(productFeed => {
      productFeed.feedsArray.forEach(innerFeed => {
        allFeedIds.add(innerFeed.id)
      })
    })

    allFeedIds.forEach(feedId => {
      const feedsData = feedsArrays.map(productFeed => {
        const foundFeed = productFeed.feedsArray.find(f => f.id === feedId)
        return {
          productFeedLabel: productFeed.label,
          exists: !!foundFeed,
          feed: foundFeed,
          index: foundFeed ? productFeed.feedsArray.findIndex(f => f.id === feedId) : -1
        }
      })

      const allExist = feedsData.every(f => f.exists)

      if (allExist) {
        const allPropertiesKeys = new Set()
        
        feedsData.forEach(f => {
          Object.keys(f.feed.properties || {}).forEach(key => allPropertiesKeys.add(key))
        })

        allPropertiesKeys.forEach(propKey => {
          const propValues = feedsData.map(f => ({
            label: f.productFeedLabel,
            value: f.feed.properties?.[propKey],
            exists: propKey in (f.feed.properties || {}),
            feedIndex: f.index
          }))

          const allPropExist = propValues.every(v => v.exists)
          const allPropSame = allPropExist && propValues.every(v => 
            JSON.stringify(v.value) === JSON.stringify(propValues[0].value)
          )

          if (!allPropSame) {
            diffs.push({
              key: `Feed #${propValues[0].feedIndex + 1} (${feedId}) → ${propKey}`,
              feedId: feedId,
              propertyKey: propKey,
              feedIndex: propValues[0].feedIndex,
              values: propValues,
              type: !allPropExist ? 'missing' : 'different',
              isFeedProperty: true
            })
          }
        })
      }
    })

    return diffs
  }

  // Check if value is an image URL
  const isImageUrl = (value) => {
    if (typeof value !== 'string') return false
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
    const lowerValue = value.toLowerCase()
    return (
      (lowerValue.startsWith('http://') || lowerValue.startsWith('https://')) &&
      (imageExtensions.some(ext => lowerValue.includes(ext)) || lowerValue.includes('/image'))
    )
  }

  // Check if value is a color code
  const isColorCode = (value, key = '') => {
    if (typeof value !== 'string') return false
    const lowerKey = key.toLowerCase()
    const lowerValue = value.toLowerCase()
    
    // Check if key name suggests it's a color
    const colorKeywords = ['color', 'colour', 'background', 'tint', 'fill', 'stroke']
    const isColorKey = colorKeywords.some(keyword => lowerKey.includes(keyword))
    
    // Match hex colors: #RGB, #RRGGBB, #RRGGBBAA, or with leading #
    const isHexColor = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)
    
    // If key suggests color, be more lenient; otherwise require # prefix
    if (isColorKey && isHexColor) return true
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)
  }
  
  // Convert hex color - handles both #RRGGBBAA and #AARRGGBB (Android) formats
  const hexToRgba = (hex) => {
    // Remove # if present
    const original = hex
    hex = hex.replace('#', '')
    
    if (hex.length === 8) {
      // Check if it's Android format #AARRGGBB (alpha first)
      // If first 2 chars are 'ff', it's likely Android format with full opacity
      const firstTwo = hex.substring(0, 2).toLowerCase()
      
      if (firstTwo === 'ff') {
        // Android format #AARRGGBB with full opacity - just use RGB
        const rgb = hex.substring(2, 8)
        return `#${rgb}`
      } else {
        // Android format #AARRGGBB with transparency
        const a = parseInt(hex.substring(0, 2), 16) / 255
        const r = parseInt(hex.substring(2, 4), 16)
        const g = parseInt(hex.substring(4, 6), 16)
        const b = parseInt(hex.substring(6, 8), 16)
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
      }
    } else if (hex.length === 6) {
      // #RRGGBB format
      return `#${hex}`
    } else if (hex.length === 3) {
      // #RGB format - expand to #RRGGBB
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
    }
    return `#${hex}`
  }

  // Render value with image preview if it's an image URL
  const renderValue = (value, key = '') => {
    if (value === undefined) return <span className="text-gray-400">—</span>
    if (value === null) return <span className="text-gray-500">null</span>
    if (typeof value === 'boolean') return <span>{value ? 'true' : 'false'}</span>
    
    // Check if it's a color code
    if (isColorCode(value, key)) {
      const displayColor = hexToRgba(value)
      
      return (
        <div className="flex items-center gap-3">
          <div 
            className="w-16 h-16 rounded-lg border-2 border-gray-400 shadow-md flex-shrink-0"
            style={{ backgroundColor: displayColor }}
            title={displayColor}
          />
          <span className="font-mono text-sm font-semibold">{displayColor}</span>
        </div>
      )
    }
    
    // Check if it's an image URL
    if (isImageUrl(value)) {
      return (
        <div className="space-y-2">
          <img 
            src={value} 
            alt="Property" 
            className="max-w-xs max-h-40 rounded border border-gray-300 shadow-sm"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          <div style={{display: 'none'}} className="text-red-500 text-xs">❌ Failed to load image</div>
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-xs font-mono break-all block"
          >
            🔗 {value}
          </a>
        </div>
      )
    }
    
    return <span className="font-mono text-sm break-words">{String(value)}</span>
  }

  const formatValue = (value, key = '') => {
    if (value === undefined) return '—'
    if (value === null) return 'null'
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
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

        {/* Environment Selector */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-purple-600">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span className="text-xl">🌍</span>
            Environment
          </h2>
          <div className="flex gap-3">
            {Object.entries(ENVIRONMENTS).map(([key, env]) => (
              <button
                key={key}
                onClick={() => setSelectedEnvironment(key)}
                className={cn(
                  "px-6 py-3 rounded-lg font-medium transition-all",
                  selectedEnvironment === key
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {env.name}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Selected: <span className="font-semibold text-purple-700">{ENVIRONMENTS[selectedEnvironment].name}</span>
            {' '}({ENVIRONMENTS[selectedEnvironment].domain})
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
                        onClick={() => {
                          setCdConfigFeed(feed.id)
                          setEditCdParams(feed.cdParams || {l: '', af: '', src: '', sis: '', rt: ''})
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Edit CD Parameters"
                      >
                        <Settings size={18} />
                      </button>
                      
                      <button
                        onClick={() => removeFeed(feed.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove Feed"
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
              <div className="mt-4 space-y-3">
                <button
                  onClick={compareFeeds}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-base shadow-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    🔍 Compare Feeds & Show Differences
                  </span>
                </button>
                
                <button
                  onClick={runLocalIterationLoop}
                  disabled={isLoopRunning}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-base shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoopRunning ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Running Loop... ({loopResults.length}/{Object.keys(LOCALES).length})
                      </>
                    ) : (
                      <>
                        🌐 CD Local Iteration Loop
                      </>
                    )}
                  </span>
                </button>
              </div>
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

        {/* CD Local Iteration Loop Results */}
        {showLoopResults && loopResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🌐</span>
                <span>CD Local Iteration Loop Results</span>
              </h2>
              <button
                onClick={() => setShowLoopResults(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close Results"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Locales Tested:</span>
                  <span className="ml-2 font-bold text-blue-900">{loopResults.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Successful:</span>
                  <span className="ml-2 font-bold text-green-600">{loopResults.filter(r => r.success).length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Errors:</span>
                  <span className="ml-2 font-bold text-red-600">{loopResults.filter(r => !r.success).length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {loopResults.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "border rounded-lg p-4",
                    result.success 
                      ? result.differencesCount === 0 
                        ? "border-green-300 bg-green-50" 
                        : "border-yellow-300 bg-yellow-50"
                      : "border-red-300 bg-red-50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-800">
                        {result.localeName}
                      </span>
                      <code className="text-xs bg-white px-2 py-1 rounded border">
                        {result.locale}
                      </code>
                    </div>
                    <div>
                      {result.success ? (
                        result.differencesCount === 0 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            ✅ Identical
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                            ⚠️ {result.differencesCount} Difference{result.differencesCount !== 1 ? 's' : ''}
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          ❌ Error
                        </span>
                      )}
                    </div>
                  </div>

                  {!result.success && result.error && (
                    <div className="mt-2 p-3 bg-red-100 rounded text-sm text-red-800">
                      <span className="font-semibold">Error:</span> {result.error}
                    </div>
                  )}

                  {result.success && result.differencesCount > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                        Show {result.differencesCount} difference{result.differencesCount !== 1 ? 's' : ''}
                      </summary>
                      <div className="mt-3 space-y-3">
                        {result.differences.slice(0, 10).map((diff, diffIndex) => (
                          <div key={diffIndex} className="border border-gray-200 rounded-lg p-3 bg-white">
                            <div className="font-mono text-xs font-semibold text-gray-700 mb-2 pb-2 border-b">
                              {diff.key}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              {diff.values && diff.values.map((val, valIndex) => (
                                <div key={valIndex} className={cn(
                                  "p-2 rounded border",
                                  !val.exists ? "bg-red-50 border-red-200" : 
                                  diff.type === 'different' ? "bg-yellow-50 border-yellow-200" : 
                                  "bg-gray-50 border-gray-200"
                                )}>
                                  <div className="font-medium text-gray-600 mb-1">
                                    {val.label}
                                  </div>
                                  {val.exists ? (
                                    <div className="text-gray-800">
                                      {renderValue(val.value, diff.propertyKey || diff.key)}
                                    </div>
                                  ) : (
                                    <span className="text-red-600 font-semibold">❌ Missing</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {result.differencesCount > 10 && (
                          <div className="text-xs text-gray-500 italic text-center p-2 bg-gray-50 rounded">
                            ... and {result.differencesCount - 10} more difference{result.differencesCount - 10 !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
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
                        diff.isSummary ? "bg-blue-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      )}
                    >
                      <td className={cn(
                        "border border-gray-300 px-4 py-3 font-mono text-sm text-left",
                        diff.isSummary ? "font-bold text-blue-900" : "text-gray-800"
                      )}>
                        {diff.key}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {diff.isSummary ? (
                          diff.summaryData.allSameOrder ? (
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              ✅ Identical
                            </span>
                          ) : diff.summaryData.allSameIds ? (
                            <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                              ⚠️ Different Order
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              🔴 Different Feeds
                            </span>
                          )
                        ) : diff.type === 'missing' ? (
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
                            diff.isSummary ? "bg-blue-50" :
                            !v.exists ? "bg-red-50 text-red-700" : 
                            diff.type === 'different' ? "bg-yellow-50" : ""
                          )}
                        >
                          {diff.isSummary ? (
                            <div className="space-y-2">
                              <div className="font-semibold text-blue-900 text-sm flex items-center gap-2">
                                <span>📊 {v.count} Feeds</span>
                              </div>
                              <div className="space-y-1">
                                {v.value.map((feedId, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                      {idx + 1}
                                    </span>
                                    <span className="font-mono text-gray-700 break-all">
                                      {feedId}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : v.exists ? (
                            <div className="text-left">
                              {renderValue(v.value, diff.propertyKey || diff.key)}
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

        {/* Edit CD Parameters Modal */}
        {cdConfigFeed && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Edit CD Parameters</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Feed: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {feeds.find(f => f.id === cdConfigFeed)?.feedId}
                    </code>
                  </p>
                </div>
                <button
                  onClick={() => setCdConfigFeed(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Modify the CD parameters and click "Save & Refetch" to update and reload this feed.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Locale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Locale (l)
                    </label>
                    <select
                      value={editCdParams.l}
                      onChange={(e) => setEditCdParams({...editCdParams, l: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">-- Default --</option>
                      {Object.entries(LOCALES).map(([code, name]) => (
                        <option key={code} value={code}>{name} ({code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Feature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feature (af)
                    </label>
                    <select
                      value={editCdParams.af}
                      onChange={(e) => setEditCdParams({...editCdParams, af: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">-- Default --</option>
                      {FEATURES.map(feature => (
                        <option key={feature} value={feature}>{feature}</option>
                      ))}
                    </select>
                  </div>

                  {/* Source */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source (src)
                    </label>
                    <input
                      type="text"
                      value={editCdParams.src}
                      onChange={(e) => setEditCdParams({...editCdParams, src: e.target.value})}
                      placeholder="e.g., FOTA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* SIS */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SIS (sis)
                    </label>
                    <select
                      value={editCdParams.sis}
                      onChange={(e) => setEditCdParams({...editCdParams, sis: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">-- Default --</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </div>

                  {/* RT */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RT (rt)
                    </label>
                    <select
                      value={editCdParams.rt}
                      onChange={(e) => setEditCdParams({...editCdParams, rt: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">-- Default --</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </div>
                </div>

                {/* Preview */}
                {Object.values(editCdParams).some(v => v !== '') && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-800 mb-2">Preview:</p>
                    <pre className="text-xs font-mono text-purple-900 whitespace-pre-wrap">
                      {JSON.stringify(
                        Object.entries(editCdParams).reduce((acc, [key, value]) => {
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
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
                <button
                  onClick={() => setCdConfigFeed(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCdParametersAndRefetch}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Settings size={18} />
                  Save & Refetch
                </button>
              </div>
            </div>
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
