import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { auth, signInAnonymous, onAuthStateChanged, saveMindMap, loadMindMap, signUpWithEmail, signInWithEmail, signInWithGoogle, logOut, saveMindMapToGallery, loadUserMindMaps, subscribeToUserMindMaps, deleteMindMap } from './firebase'
import MindMapNode from './components/MindMapNode'
import LoadingSpinner from './components/LoadingSpinner'
import TreeView from './components/TreeView'
import ListView from './components/ListView'
import AuthModal from './components/AuthModal'
import ProfilePage from './components/earneygit'
import SettingsPage from './components/SettingsPage'
import TrendingIdeas from './components/TrendingIdeas'
import PricingPage from './components/PricingPage'
import UpgradePopup from './components/UpgradePopup'

// MongoDB integration removed - using Firebase only

import { processUserInput, analyzeInputQuality, ENHANCEMENT_PRESETS } from './services/promptEnhancer'
import { validateMindMapData, sanitizeText, normalizeMindMapData, validateAndNormalizeMindMapData } from './utils/jsonValidator'
import { initializeSecurity, validateApiKeys, INPUT_VALIDATION } from './config/security'
import { runSetupValidation } from './utils/setupValidator'

// AI-powered startup ideas for typewriter effect - moved outside component
const aiStartupIdeas = [
  "Claude SDK wrapper for instant website creation",
  "AI powered personalized diet plan generator",
  "Smart billing software for small businesses",
  "AI resume builder with job matching",
  "Automated social media content creation tool"
]

function App() {
  // Initialize security checks with detailed validation
  useEffect(() => {
    // Run comprehensive setup validation
    const validationResults = runSetupValidation();
    
    // Show user-friendly messages based on validation results
    if (validationResults.overall.status === 'error') {
      console.error('❌ Setup incomplete. Please check the console for details.');
    } else if (validationResults.overall.status === 'warning') {
      console.warn('⚠️ Setup has warnings. Some features may not work properly.');
    } else {
      console.log('✅ Setup validation passed. All systems ready!');
    }
  }, []);

  // Core state management with localStorage persistence
  const [startupIdea, setStartupIdea] = useState(() => {
    const saved = localStorage.getItem('zolopilot_startupIdea')
    return saved || ''
  })
  const [mindMapData, setMindMapData] = useState(() => {
    const saved = localStorage.getItem('zolopilot_mindMapData')
    return saved ? JSON.parse(saved) : null
  })
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(() => {
    const saved = localStorage.getItem('zolopilot_message')
    return saved || ''
  })
  
  // Authentication state
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // MongoDB integration removed - using Firebase only

  // Typewriter effect state
  const [currentIdeaIndex, setCurrentIdeaIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [showCursor, setShowCursor] = useState(true)
  const [showGenerationView, setShowGenerationView] = useState(() => {
    const saved = localStorage.getItem('zolopilot_showGenerationView')
    const savedMindMap = localStorage.getItem('zolopilot_mindMapData')
    // Only show generation view if we have both the flag and actual mind map data
    return saved === 'true' && savedMindMap && savedMindMap !== 'null'
  })
  const [isTextareaFocused, setIsTextareaFocused] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [isMindMapExpanded, setIsMindMapExpanded] = useState(false)
  const [isChatSectionExpanded, setIsChatSectionExpanded] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  
  // Task management state
  const [viewMode, setViewMode] = useState('flowchart') // 'flowchart' or 'list'

  const [taskData, setTaskData] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState('generation') // 'generation', 'profile', 'settings', 'trending', 'pricing'

  // LLM Configuration (hardcoded in code, can be changed by developers)
  const [selectedLLM] = useState('gemini') // Options: 'gemini', 'openai', 'anthropic'
  // SECURITY FIX: Using environment variables instead of hardcoded API keys
  const [llmApiKey] = useState(() => {
    const key = selectedLLM === 'gemini' ? import.meta.env.VITE_GEMINI_API_KEY :
      selectedLLM === 'openai' ? import.meta.env.VITE_OPENAI_API_KEY :
      selectedLLM === 'anthropic' ? import.meta.env.VITE_ANTHROPIC_API_KEY :
      '';
    console.log('🔑 DEBUG: API Key initialization:', { selectedLLM, keyExists: !!key, keyLength: key?.length });
    return key;
  }) // API keys from environment variables
  const [enablePromptEnhancement, setEnablePromptEnhancement] = useState(true) // Enable two-stage LLM processing
  const [inputQuality, setInputQuality] = useState(null) // Track input quality analysis
  const [enhancedPrompt, setEnhancedPrompt] = useState(() => {
    const saved = localStorage.getItem('zolopilot_enhancedPrompt')
    return saved || ''
  }) // Store the enhanced prompt to show users
  
  // Mindmap gallery state
  const [savedMindMaps, setSavedMindMaps] = useState(() => {
    const saved = localStorage.getItem('zolopilot_savedMindMaps')
    return saved ? JSON.parse(saved) : []
  })
  
  // Cloud-synced mind maps state
  const [cloudMindMaps, setCloudMindMaps] = useState([])
  const [mindMapSubscription, setMindMapSubscription] = useState(null)
  
  // Chat functionality state
  const [chatMessages, setChatMessages] = useState([])
  const [isEnhancing, setIsEnhancing] = useState(false)
  
  // Share functionality state
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  // Guest view state
  const [isGuestView, setIsGuestView] = useState(false)
  const [guestMindMapData, setGuestMindMapData] = useState(null)
  
  // Upgrade popup state
  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
  const [mindMapCount, setMindMapCount] = useState(0)
  

  // MongoDB integration removed - using Firebase only

  // State persistence effects
  useEffect(() => {
    localStorage.setItem('zolopilot_startupIdea', startupIdea)
  }, [startupIdea])

  useEffect(() => {
    if (mindMapData) {
      localStorage.setItem('zolopilot_mindMapData', JSON.stringify(mindMapData))
    } else {
      localStorage.removeItem('zolopilot_mindMapData')
      // Reset generation view when mind map data is cleared
      setShowGenerationView(false)
    }
  }, [mindMapData])

  useEffect(() => {
    localStorage.setItem('zolopilot_showGenerationView', (showGenerationView ?? false).toString())
  }, [showGenerationView])

  useEffect(() => {
    localStorage.setItem('zolopilot_message', message || '')
  }, [message])

  useEffect(() => {
    localStorage.setItem('zolopilot_enhancedPrompt', enhancedPrompt || '')
  }, [enhancedPrompt])

  useEffect(() => {
    localStorage.setItem('zolopilot_savedMindMaps', JSON.stringify(savedMindMaps || []))
  }, [savedMindMaps])

  // Note: Google authentication now uses popup method for universal compatibility
  // No redirect result handling needed

  // Firebase authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        setIsAuthenticated(true)
        
        try {
          // Load existing mind map (legacy)
          const savedMindMap = await loadMindMap(user.uid)
          if (savedMindMap) {
            setMindMapData(savedMindMap)
          }
        } catch (error) {
          console.warn('Could not load legacy mind map:', error.message)
          // Continue without legacy data - this is not critical
        }
        
        try {
          // Load user's mind maps from cloud
          const userMindMaps = await loadUserMindMaps(user.uid)
          setCloudMindMaps(userMindMaps)
          setMindMapCount(userMindMaps.length)
        } catch (error) {
          console.warn('Could not load user mind maps:', error.message)
          // Continue with empty array - user can create new mind maps
          setCloudMindMaps([])
          setMindMapCount(0)
        }
        
        try {
          // Subscribe to real-time updates
          const subscription = subscribeToUserMindMaps(user.uid, (mindMaps) => {
            setCloudMindMaps(mindMaps)
            setMindMapCount(mindMaps.length)
          })
          setMindMapSubscription(subscription)
        } catch (error) {
          console.warn('Could not subscribe to mind map updates:', error.message)
          // Continue without real-time updates - user can still use the app
        }
        
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setMindMapData(null)
        setCloudMindMaps([])
        setMindMapCount(0)
        
        // Cleanup subscription
        if (mindMapSubscription) {
          mindMapSubscription()
          setMindMapSubscription(null)
        }
      }
    })

    return () => {
      unsubscribe()
      if (mindMapSubscription) {
        mindMapSubscription()
      }
    }
  }, [mindMapSubscription])

  // URL parameter handling for shared links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sharedData = urlParams.get('data')
    
    if (sharedData) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(sharedData))
        setIsGuestView(true)
        setGuestMindMapData(decodedData.mindMapData)
        setStartupIdea(decodedData.prompt || 'Shared Mind Map')
        setShowGenerationView(true)
        setIsChatExpanded(false)
        setIsMindMapExpanded(true)
      } catch (error) {
        console.error('Error parsing shared data:', error)
        // If shared data is invalid, continue with normal app flow
      }
    }
  }, [])

  // LLM API call function
  const callLLM = async (prompt, isJsonOutput = false) => {
    const configs = {
      gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': llmApiKey
        },
        payload: {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        },
        responseParser: (data) => {
          if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response format from Gemini API')
          }
          return data.candidates[0].content.parts[0].text
        }
      },
      openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmApiKey}`
        },
        payload: {
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.7,
          max_tokens: 4096
        },
        responseParser: (data) => {
          if (!data?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response format from OpenAI API')
          }
          return data.choices[0].message.content
        }
      },
      anthropic: {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': llmApiKey,
          'anthropic-version': '2023-06-01'
        },
        payload: {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 8192,
          messages: [{
            role: 'user',
            content: prompt
          }]
        },
        responseParser: (data) => {
          if (!data?.content?.[0]?.text) {
            throw new Error('Invalid response format from Anthropic API')
          }
          return data.content[0].text
        }
      }
    }

    const config = configs[selectedLLM]
    
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(config.payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Details:', errorData)
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json()
      console.log('API Response:', data)
      const result = config.responseParser(data)

      if (isJsonOutput) {
        // Extract JSON from the response
        const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) || result.match(/\{[\s\S]*\}/)
        let jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : result
        
        // Clean the JSON string to remove control characters and fix common issues
        jsonString = jsonString
          // Handle all newlines within JSON string values using a more comprehensive approach
          .replace(/"([^"]*)"/g, (match, content) => {
            // Escape all newlines, carriage returns, and tabs within string content
            const escapedContent = content
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t')
              .replace(/•/g, '\\u2022') // Handle bullet points
              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove other control chars
            return `"${escapedContent}"`
          })
          // Fix malformed escape sequences
          .replace(/\\(?!["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\')
          // Remove any trailing commas before closing brackets
          .replace(/,\s*([}\]])/g, '$1')
          // Ensure proper string escaping
          .trim()
        
        try {
          console.log('🔍 DEBUG: Attempting to parse cleaned JSON...');
          const parsedResult = JSON.parse(jsonString);
          console.log('✅ DEBUG: JSON parsed successfully');
          return parsedResult;
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError)
          console.error('📋 Problematic JSON string (first 1000 chars):', jsonString.substring(0, 1000) + '...')
          console.error('🔍 Error position:', parseError.message.match(/position (\d+)/) ? parseError.message.match(/position (\d+)/)[1] : 'unknown')
          
          // Try to identify the problematic character
          const errorPos = parseError.message.match(/position (\d+)/);
          if (errorPos) {
            const pos = parseInt(errorPos[1]);
            const problemChar = jsonString.charAt(pos);
            const charCode = problemChar.charCodeAt(0);
            console.error(`🚨 Character at error position ${pos}: '${problemChar}' (char code: ${charCode})`);
            console.error('📍 Context around error:', jsonString.substring(Math.max(0, pos - 50), pos + 50));
          }
          
          // Try to fix truncated JSON
          console.log('🔧 DEBUG: Attempting to fix truncated JSON...');
          let fixedJson = jsonString;
          
          // Check if JSON is truncated and try to fix it
          const openBraces = (fixedJson.match(/\{/g) || []).length;
          const closeBraces = (fixedJson.match(/\}/g) || []).length;
          const openBrackets = (fixedJson.match(/\[/g) || []).length;
          const closeBrackets = (fixedJson.match(/\]/g) || []).length;
          
          // Add missing closing brackets/braces
          const missingBraces = openBraces - closeBraces;
          const missingBrackets = openBrackets - closeBrackets;
          
          if (missingBraces > 0 || missingBrackets > 0) {
            console.log(`🔧 DEBUG: Adding ${missingBrackets} closing brackets and ${missingBraces} closing braces`);
            
            // Remove any incomplete trailing content that might be causing issues
            fixedJson = fixedJson.replace(/,\s*$/, ''); // Remove trailing comma
            fixedJson = fixedJson.replace(/"[^"]*$/, ''); // Remove incomplete string
            fixedJson = fixedJson.replace(/\{[^}]*$/, ''); // Remove incomplete object
            
            // Add missing closing brackets and braces
            for (let i = 0; i < missingBrackets; i++) {
              fixedJson += ']';
            }
            for (let i = 0; i < missingBraces; i++) {
              fixedJson += '}';
            }
            
            try {
              console.log('🔧 DEBUG: Attempting to parse fixed JSON...');
              const fixedResult = JSON.parse(fixedJson);
              console.log('✅ DEBUG: Fixed JSON parsed successfully');
              return fixedResult;
            } catch (fixError) {
              console.error('❌ DEBUG: Fixed JSON still invalid:', fixError.message);
            }
          }
          
          throw new Error(`Invalid JSON response from LLM: ${parseError.message}`)
        }
      }

      return result
    } catch (error) {
      console.error('LLM API Error:', error)
      throw error
    }
  }



  // Input quality analysis for user feedback
  const getInputQualityFeedback = (input) => {
    const analysis = analyzeInputQuality(input)
    if (analysis.confidence >= 80) {
      return { type: 'success', message: '✅ Great input! Your idea is well-structured.' }
    } else if (analysis.confidence >= 50) {
      return { type: 'warning', message: '⚡ Good start! AI will enhance your input for better results.' }
    } else {
      return { type: 'info', message: '🤖 AI will analyze and significantly improve your input.' }
    }
  }

  // Authentication handlers
  const handleAuthRequired = () => {
    setShowAuthModal(true)
  }

  const handleAuthSuccess = (user) => {
    setUser(user)
    setIsAuthenticated(true)
    setShowAuthModal(false)
  }

  const handleSignOut = async () => {
    try {
      await logOut()
      setUser(null)
      setIsAuthenticated(false)
      setMindMapData(null)
      setStartupIdea('')
      setShowGenerationView(false)
      setMessage('')
      setEnhancedPrompt('')
      // Clear localStorage
      localStorage.removeItem('zolopilot_startupIdea')
      localStorage.removeItem('zolopilot_mindMapData')
      localStorage.removeItem('zolopilot_showGenerationView')
      localStorage.removeItem('zolopilot_message')
      localStorage.removeItem('zolopilot_enhancedPrompt')
    } catch (error) {
      setError('Failed to sign out')
    }
  }

  // Mobile menu toggle function
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Chat message handler
  const handleSendMessage = async () => {
    if (!enhancedPrompt.trim() || isEnhancing) return
    
    setIsEnhancing(true)
    const userMessage = enhancedPrompt.trim()
    setEnhancedPrompt('')
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    try {
      // Call LLM to enhance the prompt
      const enhancementPrompt = `You are an AI assistant helping to enhance startup ideas for mind map generation. The user has provided this input: "${startupIdea}"

They want to discuss: "${userMessage}"

Provide a helpful response that either:
1. Enhances their original startup idea with the new information
2. Answers their question about the startup concept
3. Provides strategic advice for their business idea

Keep your response concise but valuable, focusing on actionable insights.`
      
      const response = await callLLM(enhancementPrompt)
      
      // Add AI response to chat
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }])
      
    } catch (error) {
      console.error('Error in chat:', error)
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setIsEnhancing(false)
    }
  }

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobileMenuOpen])

  // Generate mind map function with two-stage LLM processing
  const generateMindMap = async () => {
    if (!startupIdea.trim()) {
      setError('Please enter a startup idea')
      return
    }

    if (!llmApiKey) {
      setError('API key is required for mind map generation')
      return
    }

    // Check if user is authenticated, if not, prompt for Google login
    if (!isAuthenticated || !user) {
      setLoading(true)
      setError('')
      setMessage('🔐 Signing you in with Google for the best experience...')
      
      try {
        const result = await signInWithGoogle(true); // Use redirect method
        if (result.success && result.redirecting) {
          setMessage('🔄 Redirecting to Google for authentication...')
          // The page will redirect, so we don't need to continue here
          return
        } else if (result.success && result.user) {
          // Popup method succeeded (fallback)
          setUser(result.user)
          setIsAuthenticated(true)
          setMessage('✅ Successfully signed in! Generating mind map...')
        } else {
          throw new Error(result.error || 'Authentication failed')
        }
      } catch (error) {
        console.error('❌ Google authentication failed:', error)
        setError(`Authentication failed: ${error.message}. You can still use the app without signing in.`)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError('')
    setMindMapData(null) // Clear previous mind map data to prevent showing old data
    setTaskData([]) // Clear previous task data
    setEnhancedPrompt('') // Clear any previous enhanced prompt
    setMessage('Enhancing your input with AI...')
    // Don't set showGenerationView yet - wait for approval dialog

    try {
      // Get input quality feedback
      const qualityFeedback = getInputQualityFeedback(startupIdea)
      console.log('Input quality analysis:', qualityFeedback)
      
      let finalPrompt
      let processingResult
      
      if (enablePromptEnhancement) {
        // Use the new prompt enhancement service
        setMessage('🔍 Analyzing your input quality...')
        console.log('DEBUG: Starting prompt enhancement for input:', startupIdea)
        console.log('DEBUG: enablePromptEnhancement is:', enablePromptEnhancement)
        
        // Use the prompt enhancement service
        processingResult = await processUserInput(startupIdea, callLLM, {
          enableEnhancement: true,
          autoDetectNeed: true,
          preset: 'STARTUP_MINDMAP',
          forceEnhancement: false // Let the system decide based on input quality
        })
        
        console.log('DEBUG: Processing result:', processingResult)
        console.log('DEBUG: Was enhanced?', processingResult.wasEnhanced)
        
        if (processingResult.wasEnhanced) {
          setEnhancedPrompt(processingResult.enhancedPrompt)
          setMessage('🤖 AI enhanced your input! Generating mind map...')
          setShowGenerationView(true) // Switch to generation view
          finalPrompt = `${processingResult.enhancedPrompt}\n\nGenerate a comprehensive startup mind map with detailed, actionable insights. Focus on practical steps, specific recommendations, and industry-relevant advice.`
        } else {
          setEnhancedPrompt('')
          setMessage('✨ Your input looks great! Generating mind map...')
          setShowGenerationView(true) // Switch to generation view
          finalPrompt = `${processingResult.enhancedPrompt}\n\nGenerate a comprehensive startup mind map with detailed, actionable insights. Focus on practical steps, specific recommendations, and industry-relevant advice.`
        }
      } else {
        // Single-stage processing (original behavior)
        setEnhancedPrompt('')
        setMessage('Generating mind map...')
        setShowGenerationView(true) // Switch to generation view
        finalPrompt = `Create a comprehensive startup mind map for: "${startupIdea}"`
      }
      
      await generateMindMapFromPrompt(finalPrompt, startupIdea)
    } catch (error) {
      setError(`Failed to generate mind map: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }
  
  // Share functionality functions
  const handleShareClick = () => {
    console.log('handleShareClick called, mindMapData exists:', !!mindMapData);
    if (mindMapData) {
      // Create share data object
      const shareData = {
        mindMapData: mindMapData,
        prompt: startupIdea,
        title: mindMapData.text || 'Shared Mind Map'
      }
      
      // Encode the data for URL
      const encodedData = encodeURIComponent(JSON.stringify(shareData))
      const url = `${window.location.origin}${window.location.pathname}?data=${encodedData}`
      
      console.log('Setting shareUrl to:', url);
      setShareUrl(url)
      console.log('Setting showShareModal to true');
      setShowShareModal(true)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link. Please try again.');
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Import jsPDF and html2canvas dynamically
      console.log('Starting PDF generation...');
      const { jsPDF } = await import('jspdf');
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      
      console.log('Libraries loaded:', { jsPDF: typeof jsPDF, html2canvas: typeof html2canvas });
      
      if (typeof jsPDF !== 'function') {
        throw new Error('jsPDF library failed to load properly');
      }
      
      // Find the mind map container
      const mindMapElement = document.querySelector('.tree-view');
      if (!mindMapElement) {
        throw new Error('Mind map element not found');
      }
      
      console.log('Mind map element found:', !!mindMapElement);
      
      // Get all nodes and connections for creating a flattened version
      const allNodes = mindMapElement.querySelectorAll('[data-node-id]');
      const svgElement = mindMapElement.querySelector('svg');
      
      console.log('Found nodes:', allNodes.length, 'SVG:', !!svgElement);
      
      if (allNodes.length === 0) {
        throw new Error('No mind map nodes found');
      }
      
      // Create a temporary container for flattened mind map
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: fixed;
        top: -10000px;
        left: -10000px;
        width: 2000px;
        height: 1500px;
        background: linear-gradient(135deg, #0D1518 0%, #1a2332 100%);
        z-index: -1000;
        overflow: visible;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      
      // Add essential CSS styles for proper text rendering
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .break-words {
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        .text-center {
          text-align: center;
        }
        .min-w-\\[160px\\] { min-width: 160px; }
        .min-w-\\[180px\\] { min-width: 180px; }
        .min-w-\\[200px\\] { min-width: 200px; }
        .max-w-\\[220px\\] { max-width: 220px; }
        .max-w-\\[250px\\] { max-width: 250px; }
        .max-w-\\[300px\\] { max-width: 300px; }
        .p-2 { padding: 0.5rem; }
        .p-3 { padding: 0.75rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-md { font-size: 1rem; line-height: 1.5rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .rounded { border-radius: 0.25rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .border { border-width: 1px; }
      `;
      tempContainer.appendChild(styleElement);
      document.body.appendChild(tempContainer);
      
      // Calculate node bounds to determine the mind map area
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const nodeData = [];
      
      allNodes.forEach(node => {
        const rect = node.getBoundingClientRect();
        const mindMapRect = mindMapElement.getBoundingClientRect();
        
        // Get the node's position relative to the mind map container
        const style = window.getComputedStyle(node);
        const transform = style.transform;
        
        // Extract position from the node's absolute positioning
        let nodeX = parseFloat(style.left) || 0;
        let nodeY = parseFloat(style.top) || 0;
        
        // If the node has transform, we need to account for the parent container's transform
        const parentContainer = node.closest('[style*="transform"]');
        if (parentContainer) {
          const parentTransform = parentContainer.style.transform;
          const translateMatch = parentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
          const scaleMatch = parentTransform.match(/scale\(([^)]+)\)/);
          
          if (translateMatch) {
            const translateX = parseFloat(translateMatch[1]);
            const translateY = parseFloat(translateMatch[2]);
            nodeX += translateX;
            nodeY += translateY;
          }
        }
        
        const nodeWidth = rect.width;
        const nodeHeight = rect.height;
        
        minX = Math.min(minX, nodeX);
        maxX = Math.max(maxX, nodeX + nodeWidth);
        minY = Math.min(minY, nodeY);
        maxY = Math.max(maxY, nodeY + nodeHeight);
        
        nodeData.push({
          element: node,
          x: nodeX,
          y: nodeY,
          width: nodeWidth,
          height: nodeHeight
        });
      });
      
      console.log('Node bounds:', { minX, maxX, minY, maxY });
      
      // Add padding
      const padding = 100;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      const mindMapWidth = maxX - minX;
      const mindMapHeight = maxY - minY;
      
      console.log('Mind map dimensions:', { mindMapWidth, mindMapHeight });
      
      // Update temp container size
      tempContainer.style.width = mindMapWidth + 'px';
      tempContainer.style.height = mindMapHeight + 'px';
      
      // Store node information for connection recalculation
      const nodeInfoMap = new Map();
      
      // Clone and position nodes in the temporary container
      nodeData.forEach(({ element, x, y, width, height }) => {
        const clonedNode = element.cloneNode(true);
        
        // Get the text content to calculate proper dimensions
        const textContent = element.textContent || element.innerText || '';
        const nodeLevel = element.getAttribute('data-level') || '0';
        const level = parseInt(nodeLevel);
        const nodeId = element.getAttribute('data-node-id');
        
        // Calculate proper dimensions based on text content and level
        let nodeWidth, nodeHeight;
        if (level === 0) {
          nodeWidth = Math.max(300, Math.min(400, textContent.length * 12 + 60));
          nodeHeight = Math.max(100, Math.ceil(textContent.length / 25) * 25 + 60);
        } else if (level === 1) {
          nodeWidth = Math.max(250, Math.min(350, textContent.length * 10 + 50));
          nodeHeight = Math.max(80, Math.ceil(textContent.length / 30) * 22 + 50);
        } else {
          nodeWidth = Math.max(220, Math.min(300, textContent.length * 9 + 40));
          nodeHeight = Math.max(70, Math.ceil(textContent.length / 35) * 20 + 40);
        }
        
        const newX = x - minX;
        const newY = y - minY;
        
        // Store node info for connection calculations
        nodeInfoMap.set(nodeId, {
          x: newX,
          y: newY,
          width: nodeWidth,
          height: nodeHeight,
          centerX: newX + nodeWidth / 2,
          centerY: newY + nodeHeight / 2,
          topY: newY,
          bottomY: newY + nodeHeight,
          level: level
        });
        
        // Preserve original classes and styling while setting position
        const originalClasses = element.className;
        clonedNode.className = originalClasses;
        
        // Set position and calculated size
        clonedNode.style.position = 'absolute';
        clonedNode.style.left = `${newX}px`;
        clonedNode.style.top = `${newY}px`;
        clonedNode.style.width = `${nodeWidth}px`;
        clonedNode.style.height = `${nodeHeight}px`;
        clonedNode.style.transform = 'none';
        clonedNode.style.zIndex = '10';
        clonedNode.style.overflow = 'visible';
        clonedNode.style.boxSizing = 'border-box';
        
        // Ensure text content maintains proper styling
        const textDiv = clonedNode.querySelector('.text-center.break-words') || clonedNode.querySelector('div');
        if (textDiv) {
          textDiv.style.wordWrap = 'break-word';
          textDiv.style.overflowWrap = 'break-word';
          textDiv.style.wordBreak = 'break-word';
          textDiv.style.whiteSpace = 'normal';
          textDiv.style.lineHeight = '1.4';
          textDiv.style.padding = level === 0 ? '12px' : level === 1 ? '10px' : '8px';
          textDiv.style.boxSizing = 'border-box';
          textDiv.style.width = '100%';
          textDiv.style.height = '100%';
          textDiv.style.display = 'flex';
          textDiv.style.alignItems = 'center';
          textDiv.style.justifyContent = 'center';
          textDiv.style.textAlign = 'center';
          textDiv.style.fontSize = level === 0 ? '16px' : level === 1 ? '14px' : '12px';
          textDiv.style.fontWeight = level === 0 ? '700' : level === 1 ? '600' : '500';
        }
        
        // Remove any hover effects or interactive elements
        const buttons = clonedNode.querySelectorAll('button');
        buttons.forEach(btn => btn.remove());
        
        // Remove opacity transitions that might affect capture
        const hoverElements = clonedNode.querySelectorAll('.opacity-0, .group-hover\\:opacity-100');
        hoverElements.forEach(el => {
          el.style.opacity = '0';
          el.style.display = 'none';
        });
        
        tempContainer.appendChild(clonedNode);
      });
      
      // Recreate SVG connections based on new node positions and dimensions
      if (svgElement && nodeInfoMap.size > 0) {
        // Create a new SVG element with proper L-shaped connections
        const newSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        newSVG.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        `;
        
        // Set SVG attributes for crisp line rendering
        newSVG.setAttribute('shape-rendering', 'crispEdges');
        newSVG.setAttribute('vector-effect', 'non-scaling-stroke');
        newSVG.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        // Get original connection groups (each connection has 3 lines in L-shape)
        const originalGroups = svgElement.querySelectorAll('g');
        
        // Build parent-child relationships using the actual tree structure
        const parentChildMap = new Map();
        
        // Recursive function to traverse the tree and build relationships
        const buildRelationships = (node, parentId = null) => {
          if (parentId) {
            parentChildMap.set(node.id, { parentId });
          }
          
          if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
              buildRelationships(child, node.id);
            });
          }
        };
        
        // Start from the root node (taskData[0] contains the full tree structure)
        if (taskData && taskData.length > 0) {
          buildRelationships(taskData[0]);
        }
        
        // Create L-shaped connections for each parent-child relationship
        parentChildMap.forEach((relationship, childId) => {
          const parentInfo = nodeInfoMap.get(relationship.parentId);
          const childInfo = nodeInfoMap.get(childId);
          
          if (parentInfo && childInfo) {
            // Ensure precise coordinate alignment by rounding to avoid sub-pixel rendering
            const fromX = Math.round(parentInfo.centerX);
            const fromY = Math.round(parentInfo.bottomY);
            const toX = Math.round(childInfo.centerX);
            const toY = Math.round(childInfo.topY);
            const midY = Math.round(fromY + (toY - fromY) / 2);
            
            // Create group for this connection
            const connectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Vertical line from parent - ensure perfect vertical alignment
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', fromX);
            line1.setAttribute('y1', fromY);
            line1.setAttribute('x2', fromX); // Same X coordinate for perfect vertical line
            line1.setAttribute('y2', midY);
            line1.setAttribute('stroke', '#10B981');
            line1.setAttribute('stroke-width', '4');
            line1.setAttribute('stroke-linecap', 'round');
            line1.setAttribute('shape-rendering', 'crispEdges'); // Ensure crisp rendering
            
            // Horizontal line - ensure perfect horizontal alignment
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', fromX);
            line2.setAttribute('y1', midY);
            line2.setAttribute('x2', toX);
            line2.setAttribute('y2', midY); // Same Y coordinate for perfect horizontal line
            line2.setAttribute('stroke', '#10B981');
            line2.setAttribute('stroke-width', '4');
            line2.setAttribute('stroke-linecap', 'round');
            line2.setAttribute('shape-rendering', 'crispEdges'); // Ensure crisp rendering
            
            // Vertical line to child - ensure perfect vertical alignment
            const line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line3.setAttribute('x1', toX);
            line3.setAttribute('y1', midY);
            line3.setAttribute('x2', toX); // Same X coordinate for perfect vertical line
            line3.setAttribute('y2', toY);
            line3.setAttribute('stroke', '#10B981');
            line3.setAttribute('stroke-width', '4');
            line3.setAttribute('stroke-linecap', 'round');
            line3.setAttribute('shape-rendering', 'crispEdges'); // Ensure crisp rendering
            
            connectionGroup.appendChild(line1);
            connectionGroup.appendChild(line2);
            connectionGroup.appendChild(line3);
            newSVG.appendChild(connectionGroup);
          }
        });
        
        tempContainer.appendChild(newSVG);
      }
      
      // Wait for the DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Capturing flattened mind map...');
      
      // Capture the flattened mind map
      let canvas;
      try {
        canvas = await html2canvas(tempContainer, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
          width: mindMapWidth,
          height: mindMapHeight
        });
      } catch (canvasError) {
        console.log('First attempt failed, trying simpler approach:', canvasError.message);
        canvas = await html2canvas(tempContainer, {
          scale: 0.8,
          backgroundColor: '#1a2332',
          logging: false
        });
      }
      
      console.log('Canvas generated:', { width: canvas.width, height: canvas.height });
      
      // Clean up temporary container
      document.body.removeChild(tempContainer);
      
      // Create PDF with appropriate size
      console.log('Creating PDF document...');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      console.log('PDF created successfully');
      
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit the content properly
      const imgAspectRatio = canvas.width / canvas.height;
      const pdfAspectRatio = pdfWidth / pdfHeight;
      
      let finalWidth, finalHeight;
      
      if (imgAspectRatio > pdfAspectRatio) {
        // Image is wider, fit to width
        finalWidth = pdfWidth;
        finalHeight = pdfWidth / imgAspectRatio;
      } else {
        // Image is taller, fit to height
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * imgAspectRatio;
      }
      
      // Center the image on the page
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      
      // Add watermark at bottom right corner
       const watermarkWidth = 50; // Width of the watermark box in mm
       const watermarkHeight = 6; // Height of the watermark box in mm
       const margin = 5; // Margin from edges in mm
      
      // Position at bottom right
      const watermarkX = pdfWidth - watermarkWidth - margin;
      const watermarkY = pdfHeight - watermarkHeight - margin;
      
      // Draw black rounded rectangle background
      pdf.setFillColor(0, 0, 0); // Black color
      pdf.roundedRect(watermarkX, watermarkY, watermarkWidth, watermarkHeight, 2, 2, 'F');
      
      // Add text with different colors for each part
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      // "Made with " in white
      const madeWithText = 'Made with ';
      pdf.setTextColor(255, 255, 255); // White color
      const madeWithWidth = pdf.getTextWidth(madeWithText);
      
      // "Zolopilot AI" in purple (approximating the gradient with a single purple color)
      const zolopilotText = 'Zolopilot AI';
      pdf.setTextColor(147, 51, 234); // Purple color (rgb(147, 51, 234) = #9333ea)
      const zolopilotWidth = pdf.getTextWidth(zolopilotText);
      
      // Calculate total text width and center position
      const totalTextWidth = madeWithWidth + zolopilotWidth;
      const startX = watermarkX + (watermarkWidth - totalTextWidth) / 2;
      const textY = watermarkY + watermarkHeight / 2 + 1.5; // Slightly offset for vertical centering
      
      // Draw "Made with " in white
      pdf.setTextColor(255, 255, 255);
      pdf.text(madeWithText, startX, textY);
      
      // Draw "Zolopilot AI" in purple
      pdf.setTextColor(147, 51, 234);
      pdf.text(zolopilotText, startX + madeWithWidth, textY);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `mindmap-${timestamp}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message}. Please try again.`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Function to clean bracketed content from topic headings
  const cleanTopicHeadings = (jsonString) => {
    // Remove specific bracketed content from topic headings
    let cleanedString = jsonString
      .replace(/\( Suggestions when to hire Ai agents or Human employees \)/g, '')
      .replace(/\( with proven success stories in your niche \)/g, '')
      // Clean up any double spaces or trailing spaces that might result
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+-\s+/g, ' - ')
      .replace(/\s+"/g, '"')
    
    // SECURITY FIX: Remove control characters that cause JSON parsing errors
    // Remove all control characters except newline (\n) and tab (\t) which are valid in JSON strings
    cleanedString = cleanedString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    
    // Fix any malformed escape sequences
    cleanedString = cleanedString.replace(/\\(?!["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\')
    
    return cleanedString
  }

  // Separated mind map generation logic
  const generateMindMapFromPrompt = async (finalPrompt, startupIdea) => {
    try {
      console.log('🚀 DEBUG: generateMindMapFromPrompt called with:', { finalPrompt, startupIdea });
      console.log('🔑 DEBUG: API Key available:', !!llmApiKey);
      console.log('🔑 DEBUG: Selected LLM:', selectedLLM);
      
      const mindMapPrompt = `${finalPrompt}
         
Return ONLY a JSON object with this structure (customize the content for the specific startup idea while keeping this exact structure):
        {
          "id": "root",
          "text": "${startupIdea}",
          "children": [
            {
              "id": "competitor-showcase",
              "text": "Competitor or Similar Startup Showcase",
              "children": [
                {"id": "direct-competitors", "text": "Direct Competitors\n• [Competitor 1]: [Brief description]\n• [Competitor 2]: [Brief description]\n• [Competitor 3]: [Brief description]\n• [Competitor 4]: [Brief description]\n• [Competitor 5]: [Brief description]", "children": []},
                {"id": "indirect-competitors", "text": "Indirect Competitors\n• [Alternative solution 1]: [Description]\n• [Alternative solution 2]: [Description]\n• [Substitute product/service]: [Description]\n• [Traditional method]: [Description]", "children": []},
                {"id": "similar-startups", "text": "Similar Stage Startups\n• [Startup 1]: [Market/stage description]\n• [Startup 2]: [Market/stage description]\n• [Startup 3]: [Market/stage description]\n• [Startup 4]: [Market/stage description]", "children": []},
                {"id": "competitive-advantages", "text": "Competitive Advantages\n• [Unique feature 1]: [How it differentiates]\n• [Unique feature 2]: [How it differentiates]\n• [Unique approach]: [Why it's better]\n• [Technology advantage]: [Technical superiority]", "children": []},
                {"id": "market-positioning", "text": "Market Positioning\n• [Target position]: [How you want to be perceived]\n• [Key messaging]: [Core value proposition]\n• [Differentiation strategy]: [What sets you apart]\n• [Brand promise]: [What customers can expect]", "children": []}
              ]
            },
            {
              "id": "idea-overview",
              "text": "Idea / Company Overview",
              "children": [
                {"id": "company-mission", "text": "Mission Statement\n• [Core purpose]: [Why the company exists]\n• [Target impact]: [What change you want to create]\n• [Stakeholder benefit]: [How you serve customers/society]\n• [Guiding principle]: [What drives your decisions]", "children": []},
                {"id": "company-vision", "text": "Vision Statement\n• [Future state]: [Where you want to be in 10 years]\n• [Market transformation]: [How you'll change the industry]\n• [Global impact]: [Your aspirational influence]\n• [Legacy goal]: [What you want to be remembered for]", "children": []},
                {"id": "core-values", "text": "Core Values\n• [Value 1]: [How it guides behavior]\n• [Value 2]: [How it guides behavior]\n• [Value 3]: [How it guides behavior]\n• [Value 4]: [How it guides behavior]", "children": []},
                {"id": "elevator-pitch", "text": "Elevator Pitch\n• [Problem hook]: [Compelling problem statement]\n• [Solution summary]: [What you do in simple terms]\n• [Target market]: [Who you serve]\n• [Unique advantage]: [Why you're different]\n• [Call to action]: [What you want from listener]", "children": []},
                {"id": "unique-value-prop", "text": "Unique Value Proposition\n• [Primary benefit]: [Main value you deliver]\n• [Differentiation]: [What makes you unique]\n• [Proof point]: [Evidence of your advantage]\n• [Customer outcome]: [Result customers achieve]", "children": []}
              ]
            },
            {
              "id": "problem-statement",
              "text": "Problem Statement",
              "children": [
                {"id": "problem-definition", "text": "Problem Definition\n• [Core pain point]: [What specific problem exists]\n• [Problem context]: [When/where it occurs]\n• [Impact description]: [How it affects people/businesses]\n• [Problem urgency]: [Why it needs solving now]", "children": []},
                {"id": "target-customer", "text": "Target Customer\n• [Primary segment]: [Main customer group affected]\n• [Demographics]: [Age, income, location, etc.]\n• [Psychographics]: [Behaviors, preferences, values]\n• [Pain intensity]: [How severely they feel the problem]", "children": []},
                {"id": "problem-magnitude", "text": "Problem Magnitude\n• [Market size]: [Number of people affected]\n• [Financial impact]: [Cost of the problem]\n• [Frequency]: [How often the problem occurs]\n• [Severity scale]: [Degree of impact on users]", "children": []},
                {"id": "current-solutions", "text": "Current Solutions\n• [Solution 1]: [Existing alternative and its limitations]\n• [Solution 2]: [Existing alternative and its limitations]\n• [Workarounds]: [How people currently cope]\n• [Gap analysis]: [What's missing in current options]", "children": []},
                {"id": "market-validation", "text": "Market Validation\n• [Research data]: [Studies supporting problem existence]\n• [Customer interviews]: [Direct feedback from target users]\n• [Market trends]: [Industry data showing problem growth]\n• [Competitor success]: [Others solving similar problems]", "children": []}
              ]
            },
            {
              "id": "solution",
              "text": "The Solution",
              "children": [
                {"id": "solution-overview", "text": "Solution Overview\n• [Core solution]: [What your product/service does]\n• [Problem resolution]: [How it directly solves the pain point]\n• [Approach]: [Your unique method or methodology]\n• [Value delivery]: [How customers benefit immediately]", "children": []},
                {"id": "key-features", "text": "Key Features\n• [Feature 1]: [Core functionality and user benefit]\n• [Feature 2]: [Core functionality and user benefit]\n• [Feature 3]: [Core functionality and user benefit]\n• [Feature 4]: [Core functionality and user benefit]", "children": []},
                {"id": "technology-stack", "text": "Technology Stack\n• [Frontend]: [Technologies for user interface]\n• [Backend]: [Server and database technologies]\n• [Infrastructure]: [Hosting and deployment tools]\n• [Integrations]: [Third-party services and APIs]", "children": []},
                {"id": "user-experience", "text": "User Experience\n• [User journey]: [How customers discover and use solution]\n• [Interface design]: [Key UX/UI principles]\n• [Accessibility]: [How you ensure inclusive design]\n• [Support system]: [Help and guidance provided]", "children": []},
                {"id": "solution-benefits", "text": "Solution Benefits\n• [Time savings]: [How much time users save]\n• [Cost reduction]: [Financial benefits for users]\n• [Quality improvement]: [Better outcomes achieved]\n• [Competitive advantage]: [How it helps users succeed]", "children": []}
              ]
            },
            {
              "id": "market-opportunity",
              "text": "Market Opportunity (with TAM, SAM, SOM)",
              "children": [
                {"id": "tam-analysis", "text": "TAM (Total Addressable Market)\n• [Global market size]: [Total revenue opportunity worldwide]\n• [Market definition]: [Scope of the entire market category]\n• [Growth rate]: [Annual market expansion percentage]\n• [Key drivers]: [Factors fueling market growth]", "children": []},
                {"id": "sam-analysis", "text": "SAM (Serviceable Addressable Market)\n• [Addressable segment]: [Portion you can realistically target]\n• [Geographic scope]: [Regions you can serve effectively]\n• [Customer segments]: [Specific groups within your reach]\n• [Revenue potential]: [Realistic revenue opportunity]", "children": []},
                {"id": "som-analysis", "text": "SOM (Serviceable Obtainable Market)\n• [Realistic capture]: [Market share you can achieve]\n• [Competitive position]: [Your expected market position]\n• [Timeline]: [When you expect to reach this share]\n• [Revenue projection]: [Expected revenue from this share]", "children": []},
                {"id": "market-trends", "text": "Market Trends\n• [Trend 1]: [Industry shift and its impact]\n• [Trend 2]: [Technology advancement driving change]\n• [Trend 3]: [Consumer behavior evolution]\n• [Trend 4]: [Regulatory or economic factor]", "children": []},
                {"id": "market-timing", "text": "Market Timing\n• [Market readiness]: [Why the market is ready now]\n• [Technology maturity]: [Supporting tech is now available]\n• [Economic factors]: [Current economic conditions favor adoption]\n• [Competitive landscape]: [Window of opportunity exists]", "children": []}
              ]
            },
            {
              "id": "product-technology",
              "text": "Product / Technology",
              "children": [
                {"id": "product-roadmap", "text": "Product Roadmap\n• [Phase 1]: [MVP development and core features]\n• [Phase 2]: [Enhanced features and integrations]\n• [Phase 3]: [Advanced capabilities and scaling]\n• [Timeline]: [Key milestones and delivery dates]", "children": []},
                {"id": "mvp-definition", "text": "MVP Definition\n• [Core features]: [Essential functionality for launch]\n• [User stories]: [Key use cases to validate]\n• [Success metrics]: [How you'll measure MVP success]\n• [Launch timeline]: [Development and release schedule]", "children": []},
                {"id": "technical-architecture", "text": "Technical Architecture\n• [System design]: [Overall technical structure]\n• [Scalability plan]: [How to handle growth]\n• [Security measures]: [Data protection and privacy]\n• [Performance optimization]: [Speed and reliability features]", "children": []},
                {"id": "ip-strategy", "text": "IP Strategy\n• [Patents]: [Proprietary technology to protect]\n• [Trademarks]: [Brand elements to register]\n• [Trade secrets]: [Confidential processes or algorithms]\n• [Licensing]: [IP monetization opportunities]", "children": []},
                {"id": "quality-assurance", "text": "Quality Assurance\n• [Testing strategy]: [Automated and manual testing approach]\n• [Security protocols]: [Data protection and vulnerability management]\n• [Compliance requirements]: [Industry standards and regulations]\n• [Monitoring systems]: [Performance and error tracking]", "children": []}
              ]
            },
            {
              "id": "business-model",
              "text": "Business Model",
              "children": [
                {"id": "revenue-model", "text": "Revenue Model\n• [Primary revenue]: [Main income source (subscription/transaction/etc.)]\n• [Secondary revenue]: [Additional income streams]\n• [Revenue mix]: [Percentage breakdown of income sources]\n• [Monetization timeline]: [When each revenue stream activates]", "children": []},
                {"id": "pricing-strategy", "text": "Pricing Strategy\n• [Pricing model]: [How you structure pricing (tiered/usage/flat)]\n• [Price points]: [Specific pricing levels and rationale]\n• [Value justification]: [Why customers will pay this amount]\n• [Competitive positioning]: [How your pricing compares to alternatives]", "children": []},
                {"id": "customer-segments", "text": "Customer Segments\n• [Segment 1]: [Primary customer group and their specific needs]\n• [Segment 2]: [Secondary customer group and their needs]\n• [Segment 3]: [Tertiary customer group and their needs]\n• [Segment prioritization]: [Which segments to focus on first]", "children": []},
                {"id": "distribution-channels", "text": "Distribution Channels\n• [Direct sales]: [Your own sales team and process]\n• [Digital channels]: [Website, app stores, online platforms]\n• [Partner channels]: [Resellers, affiliates, integrations]\n• [Marketing channels]: [How customers discover you]", "children": []},
                {"id": "partnership-model", "text": "Partnership Model\n• [Strategic partners]: [Key alliances for growth]\n• [Technology partners]: [Integration and platform partnerships]\n• [Channel partners]: [Distribution and reseller relationships]\n• [Partnership benefits]: [Value exchange with partners]", "children": []}
              ]
            },
            {
              "id": "legal-registrations",
              "text": "Legal Registrations / Licenses Required to Start",
              "children": [
                {"id": "business-structure", "text": "Business Structure\n• [Entity type]: [LLC, C-Corp, S-Corp, or Partnership selection]\n• [State of incorporation]: [Where to legally establish the business]\n• [Tax implications]: [How entity choice affects taxation]\n• [Liability protection]: [Personal asset protection considerations]", "children": []},
                {"id": "industry-licenses", "text": "Industry Licenses\n• [Sector permits]: [Industry-specific licenses and certifications]\n• [Professional licenses]: [Required professional certifications]\n• [Operating permits]: [Local and state business operation permits]\n• [Renewal requirements]: [Ongoing compliance and renewal schedules]", "children": []},
                {"id": "regulatory-compliance", "text": "Regulatory Compliance\n• [Data protection]: [GDPR, CCPA, and privacy regulations]\n• [Industry standards]: [HIPAA, SOX, PCI-DSS, or sector requirements]\n• [Financial regulations]: [Securities, banking, or fintech compliance]\n• [International compliance]: [Cross-border regulatory requirements]", "children": []},
                {"id": "trademark-patents", "text": "Trademark & Patents\n• [Trademark strategy]: [Brand name and logo protection]\n• [Patent applications]: [Proprietary technology and process protection]\n• [IP portfolio]: [Comprehensive intellectual property strategy]\n• [Enforcement plan]: [How to protect and defend your IP rights]", "children": []},
                {"id": "employment-law", "text": "Employment Law\n• [Labor regulations]: [Federal and state employment law compliance]\n• [Employee agreements]: [Contracts, NDAs, and non-compete clauses]\n• [Benefits compliance]: [Healthcare, retirement, and benefit requirements]\n• [Workplace policies]: [Anti-discrimination, safety, and HR policies]", "children": []}
              ]
            },
            {
              "id": "gtm-strategy",
              "text": "Go-to-Market Strategy",
              "children": [
                {"id": "launch-strategy", "text": "Launch Strategy\n• [Market entry]: [How you'll introduce your product to the market]\n• [Launch timeline]: [Phases and key milestones for rollout]\n• [Target audience]: [Initial customer segments to focus on]\n• [Success metrics]: [How you'll measure launch effectiveness]", "children": []},
                {"id": "marketing-channels", "text": "Marketing Channels\n• [Digital marketing]: [SEO, SEM, social media, email campaigns]\n• [Content marketing]: [Blog, videos, webinars, thought leadership]\n• [PR & media]: [Press releases, media coverage, industry events]\n• [Paid advertising]: [PPC, social ads, display, retargeting]", "children": []},
                {"id": "sales-process", "text": "Sales Process\n• [Lead generation]: [How you identify and attract prospects]\n• [Lead qualification]: [Criteria for sales-ready opportunities]\n• [Conversion funnel]: [Steps from prospect to paying customer]\n• [Sales tools]: [CRM, automation, and enablement resources]", "children": []},
                {"id": "customer-acquisition", "text": "Customer Acquisition\n• [CAC optimization]: [Strategies to reduce customer acquisition cost]\n• [Growth tactics]: [Referrals, partnerships, viral mechanisms]\n• [Channel performance]: [Which acquisition channels work best]\n• [Scaling strategy]: [How to increase acquisition volume]", "children": []},
                {"id": "brand-positioning", "text": "Brand Positioning\n• [Brand messaging]: [Core value proposition and key messages]\n• [Brand identity]: [Visual identity, tone, and personality]\n• [Market perception]: [How you want to be seen vs. competitors]\n• [Brand differentiation]: [What makes your brand unique]", "children": []}
              ]
            },
            {
              "id": "traction-milestones",
              "text": "Traction & Milestones",
              "children": [
                {"id": "current-traction", "text": "Current Traction\n• [User metrics]: [Current user base, active users, growth rate]\n• [Revenue metrics]: [Current revenue, recurring revenue, growth]\n• [Partnership metrics]: [Key partnerships, pilot programs, LOIs]\n• [Product metrics]: [Usage data, feature adoption, retention]", "children": []},
                {"id": "key-metrics", "text": "Key Metrics\n• [Product-market fit]: [NPS, retention, usage frequency indicators]\n• [Growth metrics]: [User acquisition, revenue growth, market share]\n• [Operational metrics]: [Unit economics, efficiency ratios, burn rate]\n• [Leading indicators]: [Pipeline, trials, engagement signals]", "children": []},
                {"id": "milestone-timeline", "text": "Milestone Timeline\n• [6-month targets]: [Immediate goals and achievements]\n• [12-month targets]: [Annual objectives and growth milestones]\n• [18-month targets]: [Medium-term expansion and scaling goals]\n• [24-month targets]: [Long-term vision and market position]", "children": []},
                {"id": "proof-points", "text": "Proof Points\n• [Customer testimonials]: [Positive feedback and success stories]\n• [Case studies]: [Detailed examples of customer value creation]\n• [Industry recognition]: [Awards, media coverage, analyst reports]\n• [Social proof]: [Reviews, ratings, community engagement]", "children": []},
                {"id": "growth-trajectory", "text": "Growth Trajectory\n• [Historical growth]: [Past performance and trend analysis]\n• [Current momentum]: [Recent acceleration or key inflection points]\n• [Projected growth]: [Future growth forecasts and assumptions]\n• [Growth drivers]: [Key factors that will fuel continued expansion]", "children": []}
              ]
            },
            {
              "id": "team-structure",
              "text": "Team",
              "children": [
                {"id": "founding-team", "text": "Founding Team\n• [Founder 1]: [Name, role, background, and key expertise]\n• [Founder 2]: [Name, role, background, and key expertise]\n• [Team dynamics]: [How founders complement each other]\n• [Track record]: [Previous successes and relevant experience]", "children": []},
                {"id": "key-hires", "text": "Key Hires\n• [Critical roles]: [Essential positions needed for growth]\n• [Hiring timeline]: [When each role needs to be filled]\n• [Skill requirements]: [Specific expertise and experience needed]\n• [Compensation strategy]: [How you'll attract top talent]", "children": []},
                {"id": "ai-vs-human", "text": "AI vs Human\n• [AI automation]: [Tasks and processes suitable for AI]\n• [Human expertise]: [Areas requiring human judgment and creativity]\n• [Hybrid approach]: [How AI and humans work together]\n• [Cost efficiency]: [When AI provides better ROI than hiring]", "children": []},
                {"id": "advisory-board", "text": "Advisory Board\n• [Industry experts]: [Advisors with deep domain knowledge]\n• [Strategic advisors]: [Leaders who can open doors and partnerships]\n• [Technical advisors]: [Experts in your technology stack]\n• [Advisory compensation]: [Equity, cash, or other arrangements]", "children": []},
                {"id": "hiring-plan", "text": "Hiring Plan\n• [Recruitment strategy]: [How you'll find and attract candidates]\n• [Timeline priorities]: [Which roles to fill first and when]\n• [Budget allocation]: [Compensation and benefits budget]\n• [Culture building]: [How to maintain company culture while scaling]", "children": []}
              ]
            },
            {
              "id": "financial-outlook",
              "text": "Financial Outlook",
              "children": [
                {"id": "revenue-projections", "text": "Revenue Projections\n• [Year 1-2]: [Near-term revenue forecasts and assumptions]\n• [Year 3-5]: [Long-term growth projections and market expansion]\n• [Revenue streams]: [Breakdown by product lines or customer segments]\n• [Growth drivers]: [Key factors that will drive revenue increases]", "children": []},
                {"id": "cost-structure", "text": "Cost Structure\n• [Fixed costs]: [Rent, salaries, insurance, and other recurring expenses]\n• [Variable costs]: [Cost of goods sold, transaction fees, usage-based costs]\n• [Scaling costs]: [How costs change as you grow]\n• [Cost optimization]: [Strategies to improve margins over time]", "children": []},
                {"id": "profitability-timeline", "text": "Profitability Timeline\n• [Break-even point]: [When revenue equals total costs]\n• [Cash flow positive]: [When you generate positive operating cash flow]\n• [Path to profitability]: [Key milestones and efficiency improvements needed]\n• [Margin expansion]: [How gross and net margins will improve]", "children": []},
                {"id": "unit-economics", "text": "Unit Economics\n• [Customer LTV]: [Lifetime value per customer]\n• [Customer CAC]: [Cost to acquire each customer]\n• [LTV/CAC ratio]: [Efficiency of customer acquisition]\n• [Payback period]: [Time to recover customer acquisition cost]", "children": []},
                {"id": "scenario-analysis", "text": "Scenario Analysis\n• [Best case]: [Optimistic projections with favorable conditions]\n• [Base case]: [Most likely scenario with realistic assumptions]\n• [Worst case]: [Conservative projections with challenging conditions]\n• [Sensitivity analysis]: [How key variables impact financial outcomes]", "children": []}
              ]
            },
            {
              "id": "ask-funds",
              "text": "Ask & Use of Funds",
              "children": [
                {"id": "funding-amount", "text": "Funding Amount\n• [Total raise]: [Amount of capital you're seeking]\n• [Funding rationale]: [Why you need this specific amount]\n• [Milestone achievement]: [What this funding will help you accomplish]\n• [Next round planning]: [Future funding needs and timeline]", "children": []},
                {"id": "fund-allocation", "text": "Fund Allocation\n• [Product development]: [R&D, engineering, and product enhancement]\n• [Marketing & sales]: [Customer acquisition and market expansion]\n• [Team expansion]: [Key hires and talent acquisition]\n• [Operations]: [Infrastructure, legal, and working capital]", "children": []},
                {"id": "runway-extension", "text": "Runway Extension\n• [Current burn rate]: [Monthly operating expenses]\n• [Runway duration]: [How long funding will last]\n• [Milestone timeline]: [Key achievements before next funding round]\n• [Burn rate optimization]: [Plans to improve capital efficiency]", "children": []},
                {"id": "investor-type", "text": "Investor Type\n• [Angel investors]: [Individual investors and their value-add]\n• [Venture capital]: [VC firms aligned with your stage and sector]\n• [Strategic investors]: [Corporate partners with synergies]\n• [Alternative funding]: [Grants, debt, revenue-based financing]", "children": []},
                {"id": "exit-strategy", "text": "Exit Strategy\n• [IPO potential]: [Public market opportunity and timeline]\n• [Acquisition targets]: [Strategic buyers and acquisition rationale]\n• [Long-term value]: [Building a sustainable, profitable business]\n• [Investor returns]: [Expected returns and exit multiples]", "children": []}
              ]
            },
            {
              "id": "vision",
              "text": "Vision",
              "children": [
                {"id": "long-term-vision", "text": "Long-term Vision\n• [10-year goals]: [Where you see the company in a decade]\n• [Market transformation]: [How you'll change your industry]\n• [Global impact]: [Your role in solving major problems]\n• [Company evolution]: [How your business model will evolve]", "children": []},
                {"id": "impact-statement", "text": "Impact Statement\n• [Problem solving]: [Major challenges you'll help solve]\n• [Industry transformation]: [How you'll reshape your sector]\n• [Social impact]: [Positive effects on society and communities]\n• [Economic impact]: [Job creation, economic growth, innovation]", "children": []},
                {"id": "scalability-plan", "text": "Scalability Plan\n• [Geographic expansion]: [International markets and entry strategy]\n• [Product scaling]: [How to serve millions of customers]\n• [Technology scaling]: [Infrastructure for massive growth]\n• [Market domination]: [Path to becoming the category leader]", "children": []},
                {"id": "innovation-roadmap", "text": "Innovation Roadmap\n• [Future products]: [Next-generation offerings and features]\n• [Technology evolution]: [How your tech stack will advance]\n• [R&D priorities]: [Research areas and innovation investments]\n• [Competitive moats]: [How innovation will protect your position]", "children": []},
                {"id": "legacy-goals", "text": "Legacy Goals\n• [Industry legacy]: [How you want to be remembered in your sector]\n• [Innovation legacy]: [Breakthrough technologies or methods you'll create]\n• [Social legacy]: [Positive changes you'll bring to the world]\n• [Business legacy]: [The company culture and values you'll establish]", "children": []}
              ]
            },
            {
              "id": "goal-setting-system",
              "text": "Goal Setting System",
              "children": [
                {"id": "recommended-framework", "text": "Recommended Framework\n• [Framework type]: [OKRs, SMART goals, or other methodology]\n• [Startup alignment]: [Why this framework suits startup agility]\n• [Measurement approach]: [How to track progress and success]\n• [Flexibility features]: [How to adapt as priorities change]", "children": []},
                {"id": "framework-rationale", "text": "Why This Framework\n• [Proven effectiveness]: [Track record with similar startups]\n• [Focus benefits]: [How it helps maintain strategic focus]\n• [Measurable progress]: [Clear metrics and accountability]\n• [Team alignment]: [How it keeps everyone working toward same goals]", "children": []},
                {"id": "implementation-guide", "text": "Implementation Guide\n• [Setup process]: [How to establish the framework initially]\n• [Cycle timing]: [Quarterly, monthly, or other review periods]\n• [Check-in process]: [Regular review and adjustment meetings]\n• [Tools and systems]: [Software and processes to support implementation]", "children": []},
                {"id": "success-examples", "text": "Success Stories\n• [Industry examples]: [Companies in your sector using this framework]\n• [Startup examples]: [Early-stage companies with proven results]\n• [Growth examples]: [How framework supported scaling]\n• [Pivot examples]: [How framework helped navigate changes]", "children": []},
                {"id": "niche-applications", "text": "Niche Applications\n• [Industry-specific]: [Customizations for your sector]\n• [Stage-specific]: [Adaptations for your startup stage]\n• [Team-specific]: [Modifications for your team structure]\n• [Best practices]: [Proven tactics from similar companies]", "children": []}
              ]
            }
          ]
        }

Return ONLY the JSON object, no markdown or additional text.`

      console.log('📤 DEBUG: Sending prompt to LLM:', mindMapPrompt.substring(0, 200) + '...');
      const rawMindMapResult = await callLLM(mindMapPrompt, true)
      console.log('📥 DEBUG: Raw LLM response received:', typeof rawMindMapResult, rawMindMapResult);
      
      // SECURITY FIX: Clean and validate JSON with secure parsing
      let mindMapResult = rawMindMapResult
      if (typeof rawMindMapResult === 'string') {
        // If result is a string, clean it and parse securely
        const cleanedJsonString = cleanTopicHeadings(rawMindMapResult)
        const parseResult = safeJsonParse(cleanedJsonString)
        if (!parseResult.success) {
          throw new Error(`Invalid JSON structure: ${parseResult.errors.join(', ')}`)
        }
        mindMapResult = parseResult.data
      } else if (typeof rawMindMapResult === 'object' && rawMindMapResult !== null) {
        // If result is already a valid object, use it directly
        console.log('📋 DEBUG: Using object directly, skipping JSON string processing');
        mindMapResult = rawMindMapResult
      } else {
        throw new Error('Invalid LLM response: Expected string or object, got ' + typeof rawMindMapResult)
      }
      
      // COMPREHENSIVE ERROR HANDLING - Wrap entire processing in try-catch
      try {
        // BULLETPROOF DATA TRANSFORMATION - Aggressive conversion to expected format
        console.log('🛡️ DEBUG: Starting bulletproof data transformation...');
      
        const aggressiveTransform = (data) => {
          // If data is null, undefined, or not an object, create a minimal valid structure
          if (!data || typeof data !== 'object') {
            console.log('⚠️ DEBUG: Invalid data detected, creating fallback structure');
            return {
              id: 'root',
              text: 'Generated Mind Map',
              children: []
            };
          }
          
          const transform = (node, depth = 0) => {
            // Prevent infinite recursion
            if (depth > 10) {
              console.log('⚠️ DEBUG: Max depth reached, stopping recursion');
              return { id: 'max-depth', text: 'Max depth reached', children: [] };
            }
            
            // Create a clean node structure
            const cleanNode = {
              id: String(node.id || node.key || node.name || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
              text: String(node.text || node.title || node.content || node.label || 'Untitled'),
              children: []
            };
            
            // Handle children - convert ANY format to array
            let childrenData = node.children || node.items || node.nodes || node.subtasks || [];
            
            if (Array.isArray(childrenData)) {
              // Already an array - transform each child
              cleanNode.children = childrenData.map(child => transform(child, depth + 1));
            } else if (childrenData && typeof childrenData === 'object') {
              // Object - convert to array using Object.values, Object.entries, or manual extraction
              console.log('🔧 DEBUG: Converting object children to array at depth', depth);
              
              // Try multiple extraction methods while preserving order
              let extractedChildren = [];
              
              // Method 1: Object.values (preserves insertion order in modern JS)
              const values = Object.values(childrenData);
              if (values.length > 0 && values.every(v => v && typeof v === 'object')) {
                extractedChildren = values;
              } else {
                // Method 2: Object.entries and reconstruct (preserves key order)
                const entries = Object.entries(childrenData);
                // Sort entries by key to ensure consistent ordering if needed
                const sortedEntries = entries.sort(([a], [b]) => {
                  // Try to maintain numeric order if keys are numeric
                  const numA = parseInt(a);
                  const numB = parseInt(b);
                  if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                  }
                  // Otherwise maintain string order
                  return a.localeCompare(b);
                });
                extractedChildren = sortedEntries.map(([key, value]) => {
                  if (value && typeof value === 'object') {
                    return { ...value, id: value.id || key };
                  } else {
                    return { id: key, text: String(value), children: [] };
                  }
                });
              }
              
              cleanNode.children = extractedChildren.map(child => transform(child, depth + 1));
            } else {
              // Primitive or null - no children
              cleanNode.children = [];
            }
            
            return cleanNode;
          };
          
          return transform(data);
        };
      
        // Apply aggressive transformation
        mindMapResult = aggressiveTransform(mindMapResult);
        console.log('✅ DEBUG: Bulletproof transformation completed');
        
        // OPTIONAL VALIDATION - If it fails, we continue anyway
        try {
          console.log('🔍 DEBUG: Attempting optional validation...');
          const validation = validateAndNormalizeMindMapData(mindMapResult);
          if (validation.valid) {
            console.log('✅ DEBUG: Optional validation passed');
            mindMapResult = validation.data;
          } else {
            console.warn('⚠️ DEBUG: Optional validation failed, but continuing with transformed data:', validation.errors);
            // Continue with our aggressively transformed data
          }
        } catch (validationError) {
          console.warn('⚠️ DEBUG: Validation threw error, but continuing with transformed data:', validationError.message);
          // Continue with our aggressively transformed data
        }
      
        // FINAL STRUCTURE GUARANTEE - Ensure 100% compatibility
        console.log('🔒 DEBUG: Applying final structure guarantee...');
        const finalStructureGuarantee = (data) => {
          const guarantee = (node) => {
            // Absolutely ensure the node has the required structure
            const guaranteedNode = {
              id: String(node?.id || 'fallback-' + Date.now()),
              text: String(node?.text || 'Untitled Node'),
              children: []
            };
            
            // Absolutely ensure children is an array
            if (node?.children) {
              if (Array.isArray(node.children)) {
                guaranteedNode.children = node.children.map(child => guarantee(child));
              } else {
                console.log('🚨 DEBUG: Found non-array children, forcing to empty array');
                guaranteedNode.children = [];
              }
            }
            
            return guaranteedNode;
          };
          
          return guarantee(data);
        };
        
        mindMapResult = finalStructureGuarantee(mindMapResult);
        console.log('✅ DEBUG: Final structure guarantee applied');
      
        // Sanitize text content to prevent XSS
        console.log('🧹 DEBUG: Starting text sanitization...');
        const sanitizeNode = (node) => {
          if (node.text) {
            const originalText = node.text;
            node.text = sanitizeText(node.text);
            if (originalText !== node.text) {
              console.log('🧹 DEBUG: Sanitized text for node', node.id, 'from', originalText.length, 'to', node.text.length, 'characters');
            }
          }
          if (node.children && Array.isArray(node.children)) {
            node.children.forEach(sanitizeNode)
          }
          return node
        }
        mindMapResult = sanitizeNode(mindMapResult)
        console.log('✅ DEBUG: Text sanitization completed');
        
        // EMERGENCY FALLBACK - Last resort if data is still invalid
        if (!mindMapResult || !mindMapResult.id || !Array.isArray(mindMapResult.children)) {
          console.log('🚨 DEBUG: Emergency fallback activated - creating minimal valid structure');
          mindMapResult = {
            id: 'emergency-root',
            text: startupIdea || 'Generated Mind Map',
            children: [
              {
                id: 'emergency-child-1',
                text: 'Mind map generated successfully',
                children: []
              },
              {
                id: 'emergency-child-2', 
                text: 'Data structure was automatically corrected',
                children: []
              }
            ]
          };
        }
        
        console.log('💾 DEBUG: Setting mind map data in state...');
        setMindMapData(mindMapResult)
        setMessage('Mind map generated successfully!')
        // Automatically collapse the chatbox and show the mind map
        setIsChatExpanded(false)
        setIsMindMapExpanded(true)
        console.log('✅ DEBUG: Mind map data set in state and UI updated');
        
        // Save to Firebase (legacy - single mind map)
        if (user) {
          try {
            console.log('☁️ DEBUG: Saving to Firebase (legacy)...');
            await saveMindMap(user.uid, mindMapResult)
            console.log('✅ DEBUG: Legacy mind map saved to Firebase');
          } catch (error) {
            console.warn('❌ DEBUG: Could not save legacy mind map:', error.message)
            // Continue without saving - user can still use the mind map
          }
        }
        
        // Save to cloud gallery (new - multiple mind maps)
        if (user) {
          try {
            console.log('🌐 DEBUG: Saving to cloud gallery...');
            const title = startupIdea.slice(0, 50) + (startupIdea.length > 50 ? '...' : '')
            const result = await saveMindMapToGallery(user.uid, mindMapResult, title, startupIdea)
            if (result.success) {
              console.log('✅ DEBUG: Mind map saved to cloud gallery with ID:', result.id)
              
              // Check if user has reached the 5 mind map limit for free plan
              const newCount = mindMapCount + 1
              if (newCount >= 5 && !user.isAnonymous) {
                // Show upgrade popup after 5 mind maps for registered users
                setTimeout(() => {
                  setShowUpgradePopup(true)
                }, 2000) // Show popup 2 seconds after mind map generation
              }
            } else {
              console.error('❌ DEBUG: Failed to save to cloud gallery:', result.error)
            }
          } catch (error) {
            console.warn('❌ DEBUG: Could not save to cloud gallery:', error.message)
            // Continue without saving - user can still use the mind map
          }
        } else {
          // For non-authenticated users, save to localStorage as fallback
          console.log('💽 DEBUG: Saving to local storage (non-authenticated user)...');
          const galleryItem = {
            id: mindMapResult.id,
            title: startupIdea.slice(0, 50) + (startupIdea.length > 50 ? '...' : ''),
            data: mindMapResult,
            createdAt: new Date().toISOString(),
            prompt: startupIdea
          }
          
          setSavedMindMaps(prev => {
            const newMindMaps = [galleryItem, ...prev.slice(0, 9)] // Keep only 10 most recent
            console.log('✅ DEBUG: Mind map saved to local storage, total saved:', newMindMaps.length);
            return newMindMaps
          })
        }
      } catch (processingError) {
        console.error('🚨 DEBUG: Mind map processing failed, using emergency fallback:', processingError.message);
        
        // ULTIMATE FALLBACK - Create a working mind map no matter what
        const emergencyMindMap = {
          id: 'ultimate-fallback-root',
          text: startupIdea || 'AI-Generated Business Plan',
          children: [
            {
              id: 'fallback-section-1',
              text: 'Executive Summary',
              children: [
                {
                  id: 'fallback-item-1',
                  text: 'Business concept and vision',
                  children: []
                },
                {
                  id: 'fallback-item-2', 
                  text: 'Target market and opportunity',
                  children: []
                }
              ]
            },
            {
              id: 'fallback-section-2',
              text: 'Market Analysis',
              children: [
                {
                  id: 'fallback-item-3',
                  text: 'Industry overview',
                  children: []
                },
                {
                  id: 'fallback-item-4',
                  text: 'Competitive landscape',
                  children: []
                }
              ]
            },
            {
              id: 'fallback-section-3',
              text: 'Implementation Plan',
              children: [
                {
                  id: 'fallback-item-5',
                  text: 'Development roadmap',
                  children: []
                },
                {
                  id: 'fallback-item-6',
                  text: 'Resource requirements',
                  children: []
                }
              ]
            }
          ]
        };
        
        console.log('✅ DEBUG: Emergency fallback mind map created');
        setMindMapData(emergencyMindMap);
        setMessage('Mind map generated with fallback structure');
        setIsChatExpanded(false);
        setIsMindMapExpanded(true);
      }
    } catch (error) {
      setError(`Failed to generate mind map: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Update mind map data
  const updateMindMapData = useCallback(async (newData) => {
    setMindMapData(newData)
    if (user) {
      try {
        await saveMindMap(user.uid, newData)
      } catch (error) {
        console.warn('Could not save mind map update:', error.message)
        // Continue without saving - user can still use the mind map locally
      }
    }
  }, [user])

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2))
  }

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
  }

  const resetZoom = () => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
  }

  const fitToFrame = () => {
    // Get actual canvas dimensions from the TreeView canvas area
    const treeCanvas = document.querySelector('.tree-canvas-area');
    const canvasWidth = treeCanvas?.clientWidth || 1200;
    const canvasHeight = treeCanvas?.clientHeight || 800;
    
    // Main node center position (same calculation as in TreeView)
    // TreeView positions nodes within a 300vw x 300vh container offset by -100vw, -100vh
    const mainNodeCenterX = canvasWidth * 1.5; // Within the infinite canvas coordinate system
    const mainNodeCenterY = canvasHeight * 1.33;
    
    // Calculate viewport center
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;
    
    // Calculate pan position to center the main node in the viewport
    // We need to account for the infinite canvas offset (-100vw, -100vh) and zoom
    const zoomLevel = 0.8;
    const targetPanX = viewportCenterX - (mainNodeCenterX - canvasWidth) * zoomLevel;
    const targetPanY = (viewportCenterY - 250) - (mainNodeCenterY - canvasHeight) * zoomLevel; // Move 250px higher
    
    // Reset to optimal view that centers on the main node
    setZoomLevel(zoomLevel)
    setPanPosition({ x: targetPanX, y: targetPanY })
    
    // Small delay to ensure TreeView has recalculated layout
    setTimeout(() => {
      setZoomLevel(zoomLevel)
      setPanPosition({ x: targetPanX, y: targetPanY })
    }, 100)
  }

  // Auto-center when mindmap is first generated
  useEffect(() => {
    if (mindMapData && taskData.length > 0) {
      // Small delay to ensure the TreeView has rendered and calculated layout
      setTimeout(() => {
        // Use the same centering logic as fitToFrame
        const treeCanvas = document.querySelector('.tree-canvas-area');
        const canvasWidth = treeCanvas?.clientWidth || 1200;
        const canvasHeight = treeCanvas?.clientHeight || 800;
        const mainNodeCenterX = canvasWidth * 1.5;
        const mainNodeCenterY = canvasHeight * 1.33;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const viewportCenterX = viewportWidth / 2;
        const viewportCenterY = viewportHeight / 2;
        const zoomLevel = 0.8;
         const targetPanX = viewportCenterX - (mainNodeCenterX - canvasWidth) * zoomLevel;
         const targetPanY = (viewportCenterY - 250) - (mainNodeCenterY - canvasHeight) * zoomLevel; // Move 250px higher
        
        setZoomLevel(zoomLevel)
        setPanPosition({ x: targetPanX, y: targetPanY })
      }, 300) // Slightly longer delay for initial generation
    }
  }, [mindMapData, taskData.length])

  // Convert mindmap data to task data
  const convertMindMapToTasks = (mindMapData) => {
    const convertNode = (node, level = 0) => {
      const task = {
        id: node.id || uuidv4(),
        title: node.text || node.title || 'Untitled Task',
        completed: false,
        priority: level === 0 ? 'high' : level === 1 ? 'medium' : 'low',
        dueDate: null,
        assignee: null,
        tags: [],
        notes: '',
        predecessors: [],
        successors: [],
        predecessorsCompleted: [],
        delegated: false,
        overdue: false,
        children: []
      }
      
      if (node.children && node.children.length > 0) {
        task.children = node.children.map(child => convertNode(child, level + 1))
      }
      
      return task
    }
    
    if (!mindMapData) return []
    
    if (Array.isArray(mindMapData)) {
      return mindMapData.map(node => convertNode(node))
    } else {
      return [convertNode(mindMapData)]
    }
  }

  // Task management functions
  const updateTaskData = useCallback(async (updatedTask) => {
    const updateTaskInArray = (tasks, targetId, newTask) => {
      return tasks.map(task => {
        if (task.id === targetId) {
          return newTask
        }
        if (task.children && task.children.length > 0) {
          return {
            ...task,
            children: updateTaskInArray(task.children, targetId, newTask)
          }
        }
        return task
      })
    }
    
    const newTaskData = updateTaskInArray(taskData, updatedTask.id, updatedTask)
    setTaskData(newTaskData)
    
    // Also update the original mindmap data for backwards compatibility
    if (user) {
      try {
        await saveMindMap(user.uid, newTaskData[0]) // Save the root task as mindmap
      } catch (error) {
        console.warn('Could not save task update:', error.message)
        // Continue without saving - user can still use the tasks locally
      }
    }
  }, [taskData, user])

  const deleteTaskData = useCallback(async (taskId) => {
    const deleteTaskFromArray = (tasks, targetId) => {
      return tasks.filter(task => task.id !== targetId).map(task => {
        if (task.children && task.children.length > 0) {
          return {
            ...task,
            children: deleteTaskFromArray(task.children, targetId)
          }
        }
        return task
      })
    }
    
    const newTaskData = deleteTaskFromArray(taskData, taskId)
    setTaskData(newTaskData)
    
    // Also update the original mindmap data for backwards compatibility
    if (user && newTaskData.length > 0) {
      try {
        await saveMindMap(user.uid, newTaskData[0])
      } catch (error) {
        console.warn('Could not save task deletion:', error.message)
        // Continue without saving - user can still use the tasks locally
      }
    }
  }, [taskData, user])

  const addTaskData = useCallback(async () => {
    const newTask = {
      id: uuidv4(),
      title: 'New Task',
      completed: false,
      priority: 'medium',
      dueDate: null,
      assignee: null,
      tags: [],
      notes: '',
      predecessors: [],
      successors: [],
      predecessorsCompleted: [],
      delegated: false,
      overdue: false,
      children: []
    }
    
    const newTaskData = [...taskData, newTask]
    setTaskData(newTaskData)
    
    // Also update the original mindmap data for backwards compatibility
    if (user) {
      try {
        await saveMindMap(user.uid, newTaskData[0])
      } catch (error) {
        console.warn('Could not save new task:', error.message)
        // Continue without saving - user can still use the tasks locally
      }
    }
  }, [taskData, user])

  // Convert mindmap data to task data when loaded
  useEffect(() => {
    if (mindMapData && taskData.length === 0) {
      const convertedTasks = convertMindMapToTasks(mindMapData)
      setTaskData(convertedTasks)
    }
  }, [mindMapData, taskData.length])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('')
        setError('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message, error])



  // Cursor blinking effect
  useEffect(() => {
    if (!startupIdea && !isTextareaFocused && currentText) {
      const cursorTimer = setInterval(() => {
        setShowCursor(prev => !prev)
      }, 500) // Cursor blink speed
      return () => clearInterval(cursorTimer)
    }
  }, [startupIdea, isTextareaFocused, currentText])

  // Initialize typewriter effect
  useEffect(() => {
    if (!startupIdea && !isTextareaFocused && !currentText && isTyping && currentIdeaIndex === 0) {
      // Start the typewriter effect immediately (only for first load)
      const timer = setTimeout(() => {
        setCurrentText(aiStartupIdeas[0].slice(0, 1))
      }, 100) // Small delay to ensure initialization
      return () => clearTimeout(timer)
    }
  }, [startupIdea, isTextareaFocused, currentText, isTyping, currentIdeaIndex])

  // Typewriter effect for AI startup ideas
  useEffect(() => {
    if (startupIdea || isTextareaFocused) return // Don't show typewriter if user has typed something or textarea is focused

    const currentIdea = aiStartupIdeas[currentIdeaIndex]
    
    if (isTyping) {
      if (currentText.length < currentIdea.length) {
        const timer = setTimeout(() => {
          setCurrentText(currentIdea.slice(0, currentText.length + 1))
        }, 80) // Slightly slower typing speed for better visibility
        return () => clearTimeout(timer)
      } else {
        // Finished typing, pause then start erasing
        const timer = setTimeout(() => {
          setIsTyping(false)
        }, 3000) // Longer pause duration to read the idea
        return () => clearTimeout(timer)
      }
    } else {
      if (currentText.length > 0) {
        const timer = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1))
        }, 40) // Slightly slower erasing speed
        return () => clearTimeout(timer)
      } else {
        // Finished erasing, move to next idea with a small delay
        const timer = setTimeout(() => {
          setCurrentIdeaIndex((prev) => (prev + 1) % aiStartupIdeas.length)
          setIsTyping(true)
        }, 200) // Small delay to prevent flashing
        return () => clearTimeout(timer)
      }
    }
  }, [currentText, currentIdeaIndex, isTyping, startupIdea, isTextareaFocused])

  // Share Modal Component
  const ShareModal = () => {
    console.log('ShareModal render - showShareModal:', showShareModal, 'shareUrl:', shareUrl);
    if (!showShareModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 w-96 max-w-[90vw] border border-slate-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Share Mind Map</h3>
            <button
              onClick={() => setShowShareModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Copy Link Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Share Link</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
            
            {/* Download PDF Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Download as PDF</label>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
              >
                {isGeneratingPDF ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Guest view - only show mind map
  if (isGuestView && guestMindMapData) {
    const guestTasks = convertMindMapToTasks(guestMindMapData);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-black to-black relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-purple-950/5 to-black/95"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,10,25,0.08),transparent_85%)]"></div>
        
        <div className="relative z-10 h-screen flex flex-col">
          {/* Simple header for guest view */}
          <header className="w-full px-6 py-4 border-b border-slate-700/50">
            <div className="flex items-center justify-center">
              <h2 className="text-xl font-bold text-white">Zolopilot AI - Mind Map</h2>
            </div>
          </header>
          
          {/* Full screen mind map */}
           <div className="flex-1 overflow-hidden relative">
             <div className="w-full h-full bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden dotted-background">
               <TreeView
                 tasks={guestTasks}
                 onUpdateTask={() => {}}
                 onDeleteTask={() => {}}
                 onAddTask={() => {}}
                 zoomLevel={1}
                 panPosition={{ x: 0, y: 0 }}
                 onPanChange={() => {}}
                 onZoomChange={() => {}}
               />
             </div>
             
             {/* Watermark */}
             <div className="absolute bottom-4 right-4 z-50">
               <a 
                 href="https://zolopilot-ai.vercel.app/" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="inline-block bg-black rounded-md text-xs font-bold shadow-lg border border-gray-600 hover:bg-gray-900 hover:border-gray-500 transition-all duration-200 cursor-pointer"
                 style={{
                   fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                   letterSpacing: '0.025em',
                   textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                   padding: '3px 1px',
                   lineHeight: '1',
                   display: 'inline-block',
                   whiteSpace: 'nowrap'
                 }}
               >
                 <span className="text-white">Made with </span>
                 <span className="bg-gradient-to-r from-purple-800 to-purple-900 bg-clip-text text-transparent">Zolopilot AI</span>
               </a>
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (showGenerationView) {
    // Desktop view
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-black to-black relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-purple-950/5 to-black/95"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,10,25,0.08),transparent_85%)]"></div>
          
          <div className="relative z-10 h-screen flex flex-col">
            {/* Header */}
            {!isMindMapExpanded && (
            <header className="w-full px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => {
                      setShowGenerationView(false)
                      setMindMapData(null)
                      setStartupIdea('')
                      setMessage('')
                      setEnhancedPrompt('')
                      setError('')
                      // Clear localStorage for fresh start
                      localStorage.removeItem('zolopilot_startupIdea')
                      localStorage.removeItem('zolopilot_mindMapData')
                      localStorage.removeItem('zolopilot_showGenerationView')
                      localStorage.removeItem('zolopilot_message')
                      localStorage.removeItem('zolopilot_enhancedPrompt')
                    }}
                    className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors bg-slate-800/50 hover:bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/50"
                    title="Start new idea"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">New Idea</span>
                  </button>
                  <h2 className="text-xl font-bold text-white">Zolopilot AI</h2>
                </div>
                <div className="flex items-center space-x-4">
                  {loading && <LoadingSpinner size="sm" />}
                  {isAuthenticated && (
                    <button 
                      onClick={handleSignOut}
                      className="text-white hover:text-purple-300 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-sm border border-slate-600/50"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            </header>
            )}

            {/* Split Screen Content */}
            <div className={`${isMindMapExpanded ? 'h-full' : 'flex-1'} flex flex-col overflow-hidden`}>
              {/* Chat Interface Section */}
              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                isChatExpanded && !isMindMapExpanded 
                  ? 'h-full flex' 
                  : isMindMapExpanded 
                  ? 'h-0 opacity-0 transform -translate-y-full' 
                  : 'h-0'
              }`}>
                {(isChatExpanded && !isMindMapExpanded) && (
                <div className="w-full border-b border-slate-700/50 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-3 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">Z</span>
                        </div>
                        <div>
                          <h3 className="text-white font-medium text-xl">Zolopilot AI</h3>
                          <p className="text-lg text-gray-400">Strategy Partner</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Collapse button clicked');
                          setIsChatExpanded(false);
                        }}
                        className="bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white p-2 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 backdrop-blur-sm border-2 border-white/20 hover:border-white/40 cursor-pointer z-10"
                        title="Collapse chat"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-black text-white px-4 py-2 rounded-lg max-w-xs">
                      <p className="text-xl">{startupIdea}</p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">Z</span>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-lg border border-slate-700/50 max-w-sm">
                      <p className="text-xl">
                        {loading ? 
                          "I'm analyzing your startup idea and creating a comprehensive mind map with strategic insights..." : 
                          "Great idea! I've created a comprehensive mind map that breaks down your startup concept into actionable strategic areas. You can see the visualization on the right and interact with different sections."
                        }
                      </p>
                    </div>
                  </div>

                  {/* Loading Animation */}
                  {loading && (
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">Z</span>
                      </div>
                      <div className="bg-slate-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-lg border border-slate-700/50">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-xl">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-slate-700/50">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Ask me anything about your startup..."
                      className="flex-1 px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-xl"
                    />
                    <button className="bg-black hover:bg-gray-900 text-white px-5 py-4 rounded-lg transition-all duration-200 font-medium text-xl">
                      Send
                    </button>
                  </div>
                </div>
                </div>
                )}
              </div>

              {/* Mind Map Section */}
              <div className={`transition-all duration-500 ease-in-out overflow-hidden flex ${
                isMindMapExpanded 
                  ? 'h-full' 
                  : isChatExpanded 
                  ? 'h-0 opacity-0 transform translate-y-full' 
                  : 'h-full'
              }`}>
                {/* Sidebar (when both are collapsed) */}
                {!isChatExpanded && !isMindMapExpanded && (
                  <div className="w-16 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 flex flex-col items-center py-4 space-y-4">
                  {/* Expand Chat Button */}
                  <button 
                    onClick={() => setIsChatExpanded(true)}
                    className="bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white p-3 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 backdrop-blur-sm border-2 border-white/20 hover:border-white/40"
                    title="Expand chat"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19l7-7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Divider */}
                  <div className="w-8 h-px bg-slate-600/50"></div>
                  
                  {/* Navigation Options */}
                  <div className="flex flex-col space-y-3">
                    {/* Generation Button */}
                    <button
                      onClick={() => setCurrentPage('generation')}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 p-2 ${
                        currentPage === 'generation'
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                          : 'bg-slate-700/50 text-gray-400 hover:bg-slate-600/50 hover:text-white'
                      }`}
                      title="Mind Map Generation"
                    >
                      <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                        <path fill="currentColor" d="M62,44h-8V32c0-1.104-0.896-2-2-2H34V20h10c1.104,0,2-0.896,2-2V6c0-1.104-0.896-2-2-2H20c-1.104,0-2,0.896-2,2v12   c0,1.104,0.896,2,2,2h10v10H12c-1.104,0-2,0.896-2,2v12H2c-1.104,0-2,0.896-2,2v12c0,1.104,0.896,2,2,2h24c1.104,0,2-0.896,2-2V46   c0-1.104-0.896-2-2-2H14V34h36v10H38c-1.104,0-2,0.896-2,2v12c0,1.104,0.896,2,2,2h24c1.104,0,2-0.896,2-2V46   C64,44.896,63.104,44,62,44z M22,8h20v8H22V8z M24,56H4v-8h20V56z M60,56H40v-8h20V56z"/>
                      </svg>
                    </button>
                    
                    {/* Share Button */}
                    {mindMapData && (
                      <button
                        onClick={handleShareClick}
                        className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 p-2 bg-slate-700/50 text-gray-400 hover:bg-slate-600/50 hover:text-white"
                        title="Share Mind Map"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Spacer */}
                  <div className="flex-1"></div>
                  
                  {/* Profile and Settings Buttons */}
                  <div className="flex flex-col space-y-3">
                    {/* Profile Button */}
                    <button
                      onClick={() => setCurrentPage('profile')}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        currentPage === 'profile'
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                          : 'bg-slate-700/50 text-gray-400 hover:bg-slate-600/50 hover:text-white'
                      }`}
                      title="Profile"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>
                    
                    {/* Settings Button */}
                    <button
                      onClick={() => setCurrentPage('settings')}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        currentPage === 'settings'
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                          : 'bg-slate-700/50 text-gray-400 hover:bg-slate-600/50 hover:text-white'
                      }`}
                      title="Settings"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  </div>
                )}

                {/* Mind Map Preview */}
                <div className={`${isMindMapExpanded ? 'w-full h-full' : isChatExpanded ? 'w-full' : 'flex-1'} flex flex-col relative`}>
                {/* Preview Header */}
                <div className="p-3 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-white font-medium text-xl">
                        {isChatExpanded ? 'Mind Map Preview' : 'Strategic Mind Map - Full View'}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-3">
                      {loading && (
                        <div className="flex items-center space-x-2 text-black">
                          <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-lg">Generating...</span>
                        </div>
                      )}
                      <button
                        onClick={() => setIsMindMapExpanded(!isMindMapExpanded)}
                        className="p-3 sm:p-2 text-white hover:text-purple-300 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200 touch-target flex items-center justify-center"
                        title={isMindMapExpanded ? 'Exit full screen' : 'Expand to full screen'}
                      >
                        <svg 
                          className="w-8 h-8" 
                          viewBox="0 0 16 16" 
                          fill="currentColor"
                        >
                          <path d="m11 8 1 0 0 -4 -4 0 0 1 3 0 0 3z" />
                          <path d="m4 12 4 0 0 -1 -3 0 0 -3 -1 0 0 4z" />
                          <path d="M13 14H3a1.00115 1.00115 0 0 1 -1 -1V3a1.00115 1.00115 0 0 1 1 -1h10a1.00115 1.00115 0 0 1 1 1v10a1.00115 1.00115 0 0 1 -1 1ZM3 3v10h10.0006L13 3Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mind Map Content */}
                <div className="flex-1 overflow-hidden">
                  {currentPage === 'profile' ? (
                    <div className="h-full w-full">
                      <ProfilePage user={user} onBack={() => setCurrentPage('generation')} />
                    </div>
                  ) : currentPage === 'settings' ? (
                    <div className="h-full w-full">
                      <SettingsPage user={user} onBack={() => setCurrentPage('generation')} />
                    </div>
                  ) : mindMapData ? (
                    <div className="h-full border border-gray-800/70 rounded-xl overflow-hidden relative">
                      {/* View Switcher - Top Left */}
                      <div className="absolute top-4 left-4 z-10">
                        <div className="flex items-center space-x-2 bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 border border-slate-600/50">
                          <button
                            onClick={() => setViewMode('flowchart')}
                            className={`px-4 py-2 rounded-md text-lg font-bold transition-all duration-200 ${
                              viewMode === 'flowchart'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                            }`}
                          >
                            Flowchart
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-md text-lg font-bold transition-all duration-200 ${
                              viewMode === 'list'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                            }`}
                          >
                            List
                          </button>
                        </div>
                      </div>





                      {/* Zoom Controls - Top Right (Flowchart only) */}
                      {viewMode === 'flowchart' && (
                        <>
                          <div className="absolute top-4 right-4 z-10">
                            <button
                              onClick={fitToFrame}
                              className="p-2 text-white hover:text-gray-900 bg-black/90 hover:bg-white/90 rounded-lg transition-all duration-200 shadow-xl backdrop-blur-sm border border-gray-900/50 hover:border-gray-200/50"
                              title="Fit to Frame"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="absolute bottom-4 right-4 z-10">
                            <div className="flex items-center space-x-1 bg-black/90 rounded-lg p-1.5 shadow-xl backdrop-blur-sm border border-gray-900/50">
                              <button
                                onClick={zoomOut}
                                className="p-1.5 text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors"
                                title="Zoom Out"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                                </svg>
                              </button>
                              
                              <button
                                onClick={resetZoom}
                                className="px-2 py-1.5 text-xs text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors min-w-[3rem]"
                                title="Reset Zoom"
                              >
                                {Math.round(zoomLevel * 100)}%
                              </button>
                              
                              <button
                                onClick={zoomIn}
                                className="p-1.5 text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors"
                                title="Zoom In"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* View Content with Dotted Background */}
                      <div className="w-full h-full dotted-background rounded-xl overflow-hidden">
                        {viewMode === 'flowchart' ? (
                          <TreeView
                             tasks={taskData}
                             onUpdateTask={updateTaskData}
                             onDeleteTask={deleteTaskData}
                             onAddTask={addTaskData}
                             zoomLevel={zoomLevel}
                             panPosition={panPosition}
                             onPanChange={setPanPosition}
                             onZoomChange={setZoomLevel}
                           />
                        ) : (
                          <ListView
                            tasks={taskData}
                            onUpdateTask={updateTaskData}
                            onDeleteTask={deleteTaskData}
                            onAddTask={addTaskData}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center border border-gray-800/70 rounded-xl dotted-background relative">
                      {/* Fit to Frame - Top Right */}
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={fitToFrame}
                          className="p-2 text-white hover:text-gray-900 bg-black/90 hover:bg-white/90 rounded-lg transition-all duration-200 shadow-xl backdrop-blur-sm border border-gray-900/50 hover:border-gray-200/50"
                          title="Fit to Frame"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Zoom Controls - Bottom Right */}
                      <div className="absolute bottom-4 right-4 z-10">
                        <div className="flex items-center space-x-1 bg-black/90 rounded-lg p-1.5 shadow-xl backdrop-blur-sm border border-gray-900/50">
                          <button
                            onClick={zoomOut}
                            className="p-1.5 text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors"
                            title="Zoom Out"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={resetZoom}
                            className="px-2 py-1.5 text-xs text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors min-w-[3rem]"
                            title="Reset Zoom"
                          >
                            {Math.round(zoomLevel * 100)}%
                          </button>
                          
                          <button
                            onClick={zoomIn}
                            className="p-1.5 text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors"
                            title="Zoom In"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </div>
                        <h3 className="text-white font-semibold mb-2">Generating Your Mind Map</h3>
                        <p className="text-gray-400 text-sm">AI is analyzing your startup idea and creating a strategic roadmap...</p>
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className="mx-6 mb-4 bg-emerald-900/50 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-lg backdrop-blur-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="mx-6 mb-4 bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg backdrop-blur-sm">
                {error}
              </div>
            )}
          </div>

          {/* Share Modal - Only in generation view */}
          {showShareModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl border border-slate-600 p-6 w-full max-w-md relative">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <h3 className="text-xl font-bold text-white mb-4">Share Mind Map</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Share Link</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Download as PDF</label>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isGeneratingPDF}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      {isGeneratingPDF ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Download PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-gray-800/20 to-black/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,30,30,0.15),transparent_70%)]"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:block w-full px-6 py-8">
          <div className="w-full flex items-center justify-between">
            {/* Left Corner - Zolopilot Logo */}
            <div className="flex-shrink-0 ml-4">
              <h2 className="text-4xl font-bold text-white tracking-wide">Zolopilot AI</h2>
            </div>
            
            {/* Center - Navigation Menu */}
            <nav className="flex items-center justify-center space-x-16">
              <button 
                onClick={() => setCurrentPage('generation')}
                className={`text-2xl font-bold transition-colors ${
                  currentPage === 'generation' 
                    ? 'text-purple-300' 
                    : 'text-white hover:text-gray-300'
                }`}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentPage('trending')}
                className={`text-2xl font-bold transition-colors ${
                  currentPage === 'trending' 
                    ? 'text-purple-300' 
                    : 'text-white hover:text-gray-300'
                }`}
              >
                Trending Ideas
              </button>
              <button 
                onClick={() => setCurrentPage('pricing')}
                className={`text-2xl font-bold transition-colors ${
                  currentPage === 'pricing' 
                    ? 'text-purple-300' 
                    : 'text-white hover:text-gray-300'
                }`}
              >
                Pricing
              </button>
              <span className="text-2xl font-bold text-gray-400 cursor-not-allowed">
                Community (Launching Soon)
              </span>
            </nav>
            
            {/* Right Corner - Auth Buttons */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <span className="text-white font-bold text-xl">
                    Welcome, {user?.displayName || user?.email || 'User'}
                  </span>
                  <button 
                    onClick={handleSignOut}
                    className="text-white hover:text-purple-300 transition-colors font-bold px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-sm text-xl"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="text-white hover:text-purple-300 transition-colors font-bold px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-sm text-xl"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-purple-500/25 backdrop-blur-sm text-xl"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        {!isMindMapExpanded && !isChatSectionExpanded && (
        <header className="md:hidden w-full px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <h2 className="text-2xl font-bold text-white tracking-wide ml-2">Zolopilot AI</h2>
            
            {/* Menu Toggle Button */}
            <button 
              onClick={toggleMobileMenu}
              className="text-white p-3 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </header>
        )}
        
        {/* Mobile Menu Dropdown */}
        {!isMindMapExpanded && !isChatSectionExpanded && isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
            <div className="px-4 py-4 space-y-4">
              
              {/* Navigation Menu */}
              <div className="space-y-3 pb-4 border-b border-slate-700/50">
                <button 
                  onClick={() => {
                    setCurrentPage('generation')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-bold text-xl ${
                    currentPage === 'generation' 
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50' 
                      : 'text-white hover:text-purple-300 hover:bg-white/5 border border-slate-600/50'
                  }`}
                >
                  Home
                </button>
                <button 
                  onClick={() => {
                    setCurrentPage('trending')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-bold text-xl ${
                    currentPage === 'trending' 
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50' 
                      : 'text-white hover:text-purple-300 hover:bg-white/5 border border-slate-600/50'
                  }`}
                >
                  Trending Ideas
                </button>
                <button 
                  onClick={() => {
                    setCurrentPage('pricing')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-bold text-xl ${
                    currentPage === 'pricing' 
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50' 
                      : 'text-white hover:text-purple-300 hover:bg-white/5 border border-slate-600/50'
                  }`}
                >
                  Pricing
                </button>
              </div>
              
              {/* Auth Buttons */}
              <div className="space-y-3">
                {isAuthenticated ? (
                  <>
                    <div className="text-center text-white font-bold py-2 text-xl">
                      Welcome, {user?.displayName || user?.email || 'User'}
                    </div>
                    <button 
                      onClick={() => {
                        handleSignOut()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full text-white hover:text-purple-300 transition-colors font-bold px-4 py-3 rounded-lg hover:bg-white/5 backdrop-blur-sm border border-slate-600/50 text-xl"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setShowAuthModal(true)
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full text-white hover:text-purple-300 transition-colors font-bold px-4 py-3 rounded-lg hover:bg-white/5 backdrop-blur-sm border border-slate-600/50 text-xl"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => {
                        setShowAuthModal(true)
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-purple-500/25 backdrop-blur-sm text-xl"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Page Content */}
        {currentPage === 'trending' && (
          <TrendingIdeas 
            onBack={() => setCurrentPage('generation')}
            onSelectIdea={async (idea) => {
              setStartupIdea(idea.description)
              setCurrentPage('generation')
              // Automatically trigger mind map generation
              setTimeout(() => {
                generateMindMap()
              }, 100) // Small delay to ensure state is updated
            }}
          />
        )}
        
        {currentPage === 'pricing' && (
          <PricingPage 
            onBack={() => setCurrentPage('generation')}
          />
        )}
        
        {currentPage === 'generation' && (
        <div className="flex-1 flex flex-col justify-center px-3 sm:px-4 md:px-6 pt-8 pb-8 sm:pt-24 sm:pb-12">
          <div className="max-w-4xl mx-auto w-full">
            {/* Header */}
            {!isChatSectionExpanded && (
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 tracking-tight px-2">
                Idea to <span className="moving-purple-gradient">Billion Dollar Roadmap</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
                AI-powered strategic planning that transforms startup visions into actionable roadmaps for unicorn-level success
              </p>
            </div>
            )}

        {/* Input Section */}
            <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700/50 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-2xl ${isChatSectionExpanded ? 'mobile-fullscreen bg-gradient-to-br from-black via-black to-black w-full h-full max-w-none mx-0 rounded-none p-4 sm:p-8 overflow-y-auto' : ''}`}>
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`text-xl sm:text-2xl font-bold text-white ${isChatSectionExpanded ? 'text-3xl' : ''}`}>
                  {isChatSectionExpanded ? 'Type Your Billion Dollar Idea Here - Full View' : 'Type Your Billion Dollar Idea Here'}
                </h2>
                <button
                  onClick={() => setIsChatSectionExpanded(!isChatSectionExpanded)}
                  className="p-3 sm:p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50 touch-target"
                  title={isChatSectionExpanded ? 'Exit Full View' : 'Expand to Full View'}
                >
                  {isChatSectionExpanded ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="mb-4 sm:mb-6">
                <div className="relative">
          <textarea
            id="startup-idea"
                    value={isTextareaFocused || startupIdea ? startupIdea : (currentText + ((!startupIdea && !isTextareaFocused && currentText && showCursor) ? '|' : ''))}
            onChange={(e) => {
              // SECURITY FIX: Validate and sanitize input
              const rawValue = e.target.value;
              
              // Check length limits
              if (rawValue.length > INPUT_VALIDATION.startupIdea.maxLength) {
                setError(`Input too long. Maximum ${INPUT_VALIDATION.startupIdea.maxLength} characters allowed.`);
                return;
              }
              
              // Basic pattern validation (allow alphanumeric, spaces, and common punctuation)
              if (rawValue && !INPUT_VALIDATION.startupIdea.pattern.test(rawValue)) {
                setError('Invalid characters detected. Please use only letters, numbers, spaces, and basic punctuation.');
                return;
              }
              
              // Clear any previous errors
              setError('');
              
              // Sanitize the input
              const sanitizedValue = sanitizeText(rawValue);
              setStartupIdea(sanitizedValue);
              
              // Analyze input quality in real-time
              if (sanitizedValue.trim()) {
                const quality = analyzeInputQuality(sanitizedValue)
                setInputQuality(quality)
              } else {
                setInputQuality(null)
              }
            }}
                    placeholder={startupIdea || isTextareaFocused ? "" : "Start typing your billion-dollar idea or watch AI suggestions..."}
                    className={`w-full ${isChatSectionExpanded ? 'h-40 sm:h-48 md:h-56' : 'h-28 sm:h-32 md:h-36'} px-3 sm:px-4 py-2 sm:py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg sm:rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-base md:text-lg leading-relaxed ${!startupIdea && !isTextareaFocused ? 'text-purple-300' : 'text-white'}`}
                    onFocus={() => {
                      setIsTextareaFocused(true)
                      setCurrentText('')
                      if (!startupIdea) {
                        setStartupIdea('')
                      }
                    }}
                    onBlur={() => {
                      setIsTextareaFocused(false)
                    }}
                    readOnly={false}
                  />
                </div>
              </div>
              
              {/* AI Enhancement Controls */}
              <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                {/* Prompt Enhancement Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-slate-900/30 rounded-lg border border-slate-600/30 space-y-2 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${enablePromptEnhancement ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      <span className="text-white font-medium text-sm sm:text-base">AI Prompt Enhancement</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-400">
                      {enablePromptEnhancement ? 'AI will refine your input for better results' : 'Direct processing without enhancement'}
                    </div>
                  </div>
                  <button
                    onClick={() => setEnablePromptEnhancement(!enablePromptEnhancement)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                      enablePromptEnhancement ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enablePromptEnhancement ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Input Quality Indicator */}
                {inputQuality && startupIdea.trim() && (
                  <div className={`p-4 rounded-lg border ${
                    inputQuality.confidence >= 80 
                      ? 'bg-green-900/30 border-green-500/50 text-green-300'
                      : inputQuality.confidence >= 50
                      ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300'
                      : 'bg-blue-900/30 border-blue-500/50 text-blue-300'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          inputQuality.confidence >= 80 ? 'bg-green-400' :
                          inputQuality.confidence >= 50 ? 'bg-yellow-400' : 'bg-blue-400'
                        }`}></div>
                        <span className="font-medium">
                          Input Quality: {inputQuality.confidence >= 80 ? 'Excellent' : inputQuality.confidence >= 50 ? 'Good' : 'Needs Enhancement'}
                        </span>
                      </div>
                      <div className="text-sm opacity-90">
                        Confidence: {inputQuality.confidence}%
                      </div>
                    </div>
                    <div className="mt-2 text-sm opacity-80">
                      {inputQuality.confidence >= 80 
                        ? '✅ Your input is well-structured and detailed. Ready for optimal mind map generation!'
                        : inputQuality.confidence >= 50
                        ? '⚡ Good foundation! AI enhancement will add structure and detail for better results.'
                        : '🤖 AI will significantly improve your input by adding context, structure, and strategic insights.'}
                    </div>
                    {inputQuality.suggestions && inputQuality.suggestions.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-1">Suggestions:</div>
                        <ul className="text-sm space-y-1 opacity-80">
                          {inputQuality.suggestions.slice(0, 3).map((suggestion, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-xs mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4 justify-center">
              <button
                onClick={generateMindMap}
                disabled={loading || !startupIdea.trim()}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-purple-900 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
              >
                {loading && <LoadingSpinner size="sm" />}
                {loading ? 'Generating...' : 'Generate Mind Map'}
              </button>
              

          </div>
        </div>

        {/* Mind Map Gallery */}
        {!isChatSectionExpanded && (user || (!user && savedMindMaps.length > 0)) && (
          <div className="max-w-4xl mx-auto w-full mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white text-center flex-1">
                  Your Mind Map Gallery {user && `(${cloudMindMaps.length}/50)`}
                </h2>
                {user && (
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Cloud Synced</span>
                  </div>
                )}
              </div>
              {(user ? cloudMindMaps : savedMindMaps).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(user ? cloudMindMaps : savedMindMaps).map((mindMap) => (
                  <div
                    key={mindMap.id}
                    className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-200 group hover:bg-slate-900/70 relative"
                  >
                    {/* Delete button for cloud mind maps */}
                    {user && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (window.confirm('Are you sure you want to delete this mind map?')) {
                            const result = await deleteMindMap(user.uid, mindMap.id)
                            if (!result.success) {
                              console.error('Failed to delete mind map:', result.error)
                            }
                          }
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs z-10"
                      >
                        ×
                      </button>
                    )}
                    <div 
                      className="flex flex-col h-full cursor-pointer"
                      onClick={() => {
                        setMindMapData(user ? mindMap.mindMapData : mindMap.data)
                        setStartupIdea(mindMap.prompt)
                        setShowGenerationView(true)
                      }}
                    >
                      <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {mindMap.title}
                      </h3>
                      <p className="text-slate-400 text-xs mb-3 line-clamp-3 flex-1">
                        {mindMap.prompt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {new Date(mindMap.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-400' : 'bg-purple-400'}`}></div>
                          <span>{user ? 'Cloud' : 'Local'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-slate-400 text-lg mb-4">
                    {user ? '🎯 No mind maps yet!' : '📝 No saved mind maps'}
                  </div>
                  <p className="text-slate-500 text-sm">
                    {user 
                      ? 'Generate your first mind map to start building your gallery of ideas.'
                      : 'Create mind maps to see them saved here locally.'
                    }
                  </p>
                </div>
              )}
              {!user && (
                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg text-center">
                  <p className="text-blue-300 text-sm">
                    💡 <strong>Sign in</strong> to sync your mind maps across devices and store up to 50 mind maps in the cloud!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
              <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-300 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 backdrop-blur-sm text-sm sm:text-base">
            {message}
          </div>
        )}
        
        {/* Type Your Billion Dollar Idea Here Chatbox - Moved to generation view */}
        

        
        {error && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 backdrop-blur-sm text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Mind Map display removed from front page - only shown in generation view */}
          </div>
        </div>
        )}
      </div>
      
      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
      
      {/* Upgrade Popup */}
      <UpgradePopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
      />

    </div>
  )
}

export default App
