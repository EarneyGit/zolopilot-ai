import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { auth, signInAnonymous, onAuthStateChanged, saveMindMap, loadMindMap, signUpWithEmail, signInWithEmail, signInWithGoogle, logOut, saveMindMapToGallery, loadUserMindMaps, subscribeToUserMindMaps, deleteMindMap } from './firebase'
import MindMapNode from './components/MindMapNode'
import LoadingSpinner from './components/LoadingSpinner'
import TreeView from './components/TreeView'
import ListView from './components/ListView'
import AuthModal from './components/AuthModal'
// MongoDB integration removed - using Firebase only

import { processUserInput, analyzeInputQuality, ENHANCEMENT_PRESETS } from './services/promptEnhancer'

// AI-powered startup ideas for typewriter effect - moved outside component
const aiStartupIdeas = [
  "Claude SDK wrapper for instant website creation",
  "AI powered personalized diet plan generator",
  "Smart billing software for small businesses",
  "AI resume builder with job matching",
  "Automated social media content creation tool"
]

function App() {
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
    return saved === 'true'
  })
  const [isTextareaFocused, setIsTextareaFocused] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  
  // Task management state
  const [viewMode, setViewMode] = useState('flowchart') // 'flowchart' or 'list'
  const [showActualTasksOnly, setShowActualTasksOnly] = useState(false)
  const [taskData, setTaskData] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // LLM Configuration (hardcoded in code, can be changed by developers)
  const [selectedLLM] = useState('gemini') // Options: 'gemini', 'openai', 'anthropic'
  const [llmApiKey] = useState('AIzaSyDOjHxvf4EzxLLxVrotj9TKMDRc-BfLtd0') // Your Gemini API key
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
    }
  }, [mindMapData])

  useEffect(() => {
    localStorage.setItem('zolopilot_showGenerationView', showGenerationView.toString())
  }, [showGenerationView])

  useEffect(() => {
    localStorage.setItem('zolopilot_message', message)
  }, [message])

  useEffect(() => {
    localStorage.setItem('zolopilot_enhancedPrompt', enhancedPrompt)
  }, [enhancedPrompt])

  useEffect(() => {
    localStorage.setItem('zolopilot_savedMindMaps', JSON.stringify(savedMindMaps))
  }, [savedMindMaps])

  // Firebase authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        setIsAuthenticated(true)
        
        // Load existing mind map (legacy)
        const savedMindMap = await loadMindMap(user.uid)
        if (savedMindMap) {
          setMindMapData(savedMindMap)
        }
        
        // Load user's mind maps from cloud
        const userMindMaps = await loadUserMindMaps(user.uid)
        setCloudMindMaps(userMindMaps)
        
        // Subscribe to real-time updates
        const subscription = subscribeToUserMindMaps(user.uid, (mindMaps) => {
          setCloudMindMaps(mindMaps)
        })
        setMindMapSubscription(subscription)
        
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setMindMapData(null)
        setCloudMindMaps([])
        
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
        responseParser: (data) => data.candidates[0].content.parts[0].text
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
        responseParser: (data) => data.choices[0].message.content
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
        responseParser: (data) => data.content[0].text
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
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1] || jsonMatch[0])
        }
        return JSON.parse(result)
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
    // Check authentication first
    if (!isAuthenticated) {
      handleAuthRequired()
      return
    }

    if (!startupIdea.trim()) {
      setError('Please enter a startup idea')
      return
    }

    if (!llmApiKey) {
      setError('API key is required for mind map generation')
      return
    }

    setLoading(true)
    setError('')
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
  

  
  // Function to clean bracketed content from topic headings
  const cleanTopicHeadings = (jsonString) => {
    // Remove specific bracketed content from topic headings
    const cleanedString = jsonString
      .replace(/\( Suggestions when to hire Ai agents or Human employees \)/g, '')
      .replace(/\( with proven success stories in your niche \)/g, '')
      // Clean up any double spaces or trailing spaces that might result
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+-\s+/g, ' - ')
      .replace(/\s+"/g, '"')
    return cleanedString
  }

  // Separated mind map generation logic
  const generateMindMapFromPrompt = async (finalPrompt, startupIdea) => {
    try {
      const mindMapPrompt = `${finalPrompt}
         
Return ONLY a JSON object with this structure (customize the content for the specific startup idea while keeping this exact structure):
        {
          "id": "root",
          "text": "Comprehensive Startup Business Plan Framework",
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

      const rawMindMapResult = await callLLM(mindMapPrompt, true)
      
      // Clean the bracketed content from topic headings
      let mindMapResult = rawMindMapResult
      if (typeof rawMindMapResult === 'string') {
        // If result is a string, clean it and parse
        const cleanedJsonString = cleanTopicHeadings(rawMindMapResult)
        mindMapResult = JSON.parse(cleanedJsonString)
      } else if (typeof rawMindMapResult === 'object') {
        // If result is already an object, stringify, clean, and parse back
        const jsonString = JSON.stringify(rawMindMapResult)
        const cleanedJsonString = cleanTopicHeadings(jsonString)
        mindMapResult = JSON.parse(cleanedJsonString)
      }
      
      if (mindMapResult && mindMapResult.id) {
        setMindMapData(mindMapResult)
        setMessage('Mind map generated successfully!')
        
        // Save to Firebase (legacy - single mind map)
        if (user) {
          await saveMindMap(user.uid, mindMapResult)
        }
        
        // Save to cloud gallery (new - multiple mind maps)
        if (user) {
          const title = startupIdea.slice(0, 50) + (startupIdea.length > 50 ? '...' : '')
          const result = await saveMindMapToGallery(user.uid, mindMapResult, title, startupIdea)
          if (result.success) {
            console.log('Mind map saved to cloud gallery with ID:', result.id)
          } else {
            console.error('Failed to save to cloud gallery:', result.error)
          }
        } else {
          // For non-authenticated users, save to localStorage as fallback
          const galleryItem = {
            id: mindMapResult.id,
            title: startupIdea.slice(0, 50) + (startupIdea.length > 50 ? '...' : ''),
            data: mindMapResult,
            createdAt: new Date().toISOString(),
            prompt: startupIdea
          }
          
          setSavedMindMaps(prev => {
            const newMindMaps = [galleryItem, ...prev.slice(0, 9)] // Keep only 10 most recent
            return newMindMaps
          })
        }
      } else {
        throw new Error('Invalid mind map structure received');
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
      await saveMindMap(user.uid, newData)
    }
  }, [user])

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3))
  }

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.25))
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
      await saveMindMap(user.uid, newTaskData[0]) // Save the root task as mindmap
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
      await saveMindMap(user.uid, newTaskData[0])
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
      await saveMindMap(user.uid, newTaskData[0])
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

    if (showGenerationView) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-black via-black to-black relative overflow-hidden">
          {/* Background gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-purple-950/5 to-black/95"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,10,25,0.08),transparent_85%)]"></div>
          
          <div className="relative z-10 h-screen flex flex-col">
            {/* Header */}
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

            {/* Split Screen Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Side - Chat Interface */}
              {isChatExpanded && (
                <div className="w-1/4 border-r border-slate-700/50 flex flex-col">
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
                        onClick={() => setIsChatExpanded(false)}
                        className="bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white p-2 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 backdrop-blur-sm border-2 border-white/20 hover:border-white/40"
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

              {/* Sidebar (when chat is collapsed) */}
              {!isChatExpanded && (
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
                  
                  {/* Placeholder for Future Options */}
                  <div className="flex flex-col space-y-3 opacity-50">
                    {/* Settings Button (Future) */}
                    <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    
                    {/* Help Button (Future) */}
                    <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Spacer */}
                  <div className="flex-1"></div>
                  
                  {/* Bottom Options (Future) */}
                  <div className="opacity-50">
                    <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Right Side - Mind Map Preview */}
              <div className={`${isChatExpanded ? 'w-3/4' : 'flex-1'} flex flex-col relative`}>
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
                    </div>
                  </div>
                </div>

                {/* Mind Map Content */}
                <div className="flex-1 overflow-hidden p-4">
                  {mindMapData ? (
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

                      {/* Actual Tasks Filter - Top Center */}
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 border border-slate-600/50">
                          <label className="flex items-center space-x-2 text-sm text-white">
                            <input
                              type="checkbox"
                              checked={showActualTasksOnly}
                              onChange={(e) => setShowActualTasksOnly(e.target.checked)}
                              className="rounded text-purple-500 focus:ring-purple-500"
                            />
                            <span>Show Actual Tasks Only</span>
                          </label>
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
                            showActualTasksOnly={showActualTasksOnly}
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
        <header className="hidden md:block w-full px-6 py-4">
          <div className="max-w-7xl mx-auto grid grid-cols-3 items-center">
            {/* Left - Zolopilot Logo */}
            <div className="flex justify-start">
              <h2 className="text-2xl font-bold text-white tracking-wide">Zolopilot AI</h2>
            </div>
            
            {/* Center - Navigation Menu */}
            <nav className="flex items-center justify-center space-x-8">
              <a href="#community" className="text-white hover:text-gray-300 transition-colors">
                Community
              </a>
              <a href="#trending-ideas" className="text-white hover:text-gray-300 transition-colors">
                Trending Ideas
              </a>
              <a href="#pricing" className="text-white hover:text-gray-300 transition-colors">
                Pricing
              </a>
            </nav>
            
            {/* Right - Social Icons and Buttons */}
            <div className="flex items-center justify-end space-x-4">
              {/* Social Icons */}
              <div className="hidden lg:flex items-center space-x-3">
                <a href="#discord" className="text-white hover:text-gray-300 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
                <a href="#linkedin" className="text-white hover:text-gray-300 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#twitter" className="text-white hover:text-gray-300 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#reddit" className="text-white hover:text-gray-300 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                </a>
              </div>
              
              {/* Auth Buttons */}
              <div className="flex items-center space-x-3">
                {isAuthenticated ? (
                  <>
                    <span className="text-white font-medium">
                      Welcome, {user?.displayName || user?.email || 'User'}
                    </span>
                    <button 
                      onClick={handleSignOut}
                      className="text-white hover:text-purple-300 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-sm"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setShowAuthModal(true)}
                      className="text-white hover:text-purple-300 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-sm"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => setShowAuthModal(true)}
                      className="bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-purple-500/25 backdrop-blur-sm"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden w-full px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <h2 className="text-2xl font-bold text-white tracking-wide">Zolopilot AI</h2>
            
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
        
        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
            <div className="px-4 py-4 space-y-4">
              {/* Social Icons */}
              <div className="flex items-center justify-center space-x-6 pb-4 border-b border-slate-700/50">
                <a href="#discord" className="text-white hover:text-purple-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
                <a href="#linkedin" className="text-white hover:text-purple-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#twitter" className="text-white hover:text-purple-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#reddit" className="text-white hover:text-purple-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                </a>
              </div>
              
              {/* Auth Buttons */}
              <div className="space-y-3">
                {isAuthenticated ? (
                  <>
                    <div className="text-center text-white font-medium py-2">
                      Welcome, {user?.displayName || user?.email || 'User'}
                    </div>
                    <button 
                      onClick={() => {
                        handleSignOut()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full text-white hover:text-purple-300 transition-colors font-medium px-4 py-3 rounded-lg hover:bg-white/5 backdrop-blur-sm border border-slate-600/50"
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
                      className="w-full text-white hover:text-purple-300 transition-colors font-medium px-4 py-3 rounded-lg hover:bg-white/5 backdrop-blur-sm border border-slate-600/50"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => {
                        setShowAuthModal(true)
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-purple-500/25 backdrop-blur-sm"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col justify-center px-3 sm:px-4 md:px-6 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 tracking-tight px-2">
                Idea to <span className="moving-purple-gradient">Billion Dollar Roadmap</span>
          </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
                AI-powered strategic planning that transforms startup visions into actionable roadmaps for unicorn-level success
          </p>
        </div>

        {/* Input Section */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700/50 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-2xl">
              <div className="mb-4 sm:mb-6">
                <div className="relative">
          <textarea
            id="startup-idea"
                    value={isTextareaFocused || startupIdea ? startupIdea : (currentText + ((!startupIdea && !isTextareaFocused && currentText && showCursor) ? '|' : ''))}
            onChange={(e) => {
              if (!isAuthenticated) {
                handleAuthRequired()
                return
              }
              setStartupIdea(e.target.value)
              // Analyze input quality in real-time
              if (e.target.value.trim()) {
                const quality = analyzeInputQuality(e.target.value)
                setInputQuality(quality)
              } else {
                setInputQuality(null)
              }
            }}
                    placeholder={startupIdea || isTextareaFocused ? "" : isAuthenticated ? "Start typing your billion-dollar idea or watch AI suggestions..." : "Sign in to start typing your billion-dollar idea..."}
                    className={`w-full h-28 sm:h-32 md:h-36 px-3 sm:px-4 py-2 sm:py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg sm:rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-base md:text-lg leading-relaxed ${!startupIdea && !isTextareaFocused ? 'text-purple-300' : 'text-white'}`}
                    onFocus={() => {
                      if (!isAuthenticated) {
                        handleAuthRequired()
                        return
                      }
                      setIsTextareaFocused(true)
                      setCurrentText('')
                      if (!startupIdea) {
                        setStartupIdea('')
                      }
                    }}
                    onBlur={() => {
                      setIsTextareaFocused(false)
                    }}
                    readOnly={(!isTextareaFocused && !startupIdea) || !isAuthenticated}
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
        {(user || (!user && savedMindMaps.length > 0)) && (
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
        
        {/* AI Enhanced Prompt Chatbox - Moved to generation view */}
        

        
        {error && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 backdrop-blur-sm text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Mind Map display removed from front page - only shown in generation view */}
          </div>
        </div>
      </div>
      
      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  )
}

export default App
