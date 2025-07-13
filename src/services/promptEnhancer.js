/**
 * Prompt Enhancement Service
 * 
 * This service implements a two-stage LLM processing system:
 * 1. Stage 1: Gemini analyzes raw user input and creates an enhanced prompt
 * 2. Stage 2: The enhanced prompt is used to generate better results
 * 
 * This approach helps handle:
 * - Vague or incomplete user inputs
 * - Random copy-pasted text
 * - Poorly structured requests
 * - Missing context or details
 */

/**
 * Enhances raw user input into a well-structured prompt
 * @param {string} rawInput - The original user input
 * @param {Function} llmCallFunction - Function to call the LLM API
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} Enhanced prompt
 */
export const enhanceUserInput = async (rawInput, llmCallFunction, options = {}) => {
  const {
    domain = 'startup business planning',
    outputFormat = 'comprehensive mind map',
    enhancementLevel = 'detailed',
    includeIndustryContext = true,
    includeMarketAnalysis = true,
    includeChallenges = true
  } = options

  const enhancementPrompt = `You are an expert business consultant and prompt engineer specializing in ${domain}. A user has provided raw input that may be incomplete, vague, or poorly structured. Your task is to analyze their input and create a comprehensive, well-structured prompt that will generate the best possible ${outputFormat}.

User's raw input: "${rawInput}"

Analyze this input and create an enhanced prompt that:
1. Clarifies any vague or incomplete ideas
2. Identifies the core business concept and value proposition
3. ${includeIndustryContext ? 'Suggests relevant industry context and trends' : ''}
4. ${includeMarketAnalysis ? 'Highlights potential market opportunities and target audience' : ''}
5. Considers practical implementation and use cases
6. ${includeChallenges ? 'Addresses potential challenges and solutions' : ''}
7. Adds missing context that would improve the output quality

Return a well-structured prompt that starts with "Create a comprehensive ${outputFormat} for:" followed by the enhanced description. The enhanced description should be 2-4 sentences that clearly articulate:
- The core concept/idea
- Target market and audience
- Key features or value proposition
- Relevant industry context

Example format:
"Create a comprehensive ${outputFormat} for: [Enhanced description that clearly defines the concept, target market, key features, value proposition, and relevant context]"

Return ONLY the enhanced prompt, no additional text, explanations, or markdown formatting.`

  try {
    const enhancedPrompt = await llmCallFunction(enhancementPrompt, false)
    return enhancedPrompt.trim().replace(/^["']|["']$/g, '') // Remove quotes if present
  } catch (error) {
    console.error('Error enhancing prompt:', error)
    // Fallback to original input if enhancement fails
    return `Create a comprehensive ${outputFormat} for: ${rawInput}`
  }
}

/**
 * Analyzes user input to determine if enhancement is needed
 * @param {string} input - User input to analyze
 * @returns {Object} Analysis result with recommendation
 */
export const analyzeInputQuality = (input) => {
  const analysis = {
    needsEnhancement: false,
    reasons: [],
    confidence: 0,
    wordCount: 0,
    hasKeywords: false,
    isStructured: false
  }

  if (!input || typeof input !== 'string') {
    analysis.needsEnhancement = true
    analysis.reasons.push('Empty or invalid input')
    return analysis
  }

  const trimmedInput = input.trim()
  analysis.wordCount = trimmedInput.split(/\s+/).length

  // Check for very short inputs
  if (analysis.wordCount < 3) {
    analysis.needsEnhancement = true
    analysis.reasons.push('Input too short (less than 3 words)')
  }

  // Check for business/startup keywords
  const businessKeywords = ['startup', 'business', 'app', 'platform', 'service', 'product', 'solution', 'market', 'customer', 'user']
  analysis.hasKeywords = businessKeywords.some(keyword => 
    trimmedInput.toLowerCase().includes(keyword)
  )

  if (!analysis.hasKeywords && analysis.wordCount < 10) {
    analysis.needsEnhancement = true
    analysis.reasons.push('Lacks business context and is brief')
  }

  // Check for structure (sentences, punctuation)
  analysis.isStructured = /[.!?]/.test(trimmedInput) && trimmedInput.length > 20

  if (!analysis.isStructured && analysis.wordCount > 5) {
    analysis.needsEnhancement = true
    analysis.reasons.push('Lacks proper sentence structure')
  }

  // Check for copy-pasted content (very long single line)
  if (analysis.wordCount > 50 && !trimmedInput.includes('\n') && !trimmedInput.includes('.')) {
    analysis.needsEnhancement = true
    analysis.reasons.push('Appears to be unstructured copy-pasted content')
  }

  // Calculate confidence score
  analysis.confidence = Math.min(100, 
    (analysis.hasKeywords ? 30 : 0) +
    (analysis.isStructured ? 40 : 0) +
    (analysis.wordCount >= 5 && analysis.wordCount <= 30 ? 30 : 0)
  )

  // Final recommendation - lowered threshold to make enhancement more likely
  analysis.needsEnhancement = analysis.confidence < 85 || analysis.reasons.length > 0

  return analysis
}

/**
 * Configuration presets for different use cases
 */
export const ENHANCEMENT_PRESETS = {
  STARTUP_MINDMAP: {
    domain: 'startup business planning',
    outputFormat: 'startup mind map',
    enhancementLevel: 'detailed',
    includeIndustryContext: true,
    includeMarketAnalysis: true,
    includeChallenges: true
  },
  BUSINESS_PLAN: {
    domain: 'business strategy',
    outputFormat: 'business plan',
    enhancementLevel: 'comprehensive',
    includeIndustryContext: true,
    includeMarketAnalysis: true,
    includeChallenges: true
  },
  PRODUCT_ROADMAP: {
    domain: 'product development',
    outputFormat: 'product roadmap',
    enhancementLevel: 'detailed',
    includeIndustryContext: false,
    includeMarketAnalysis: true,
    includeChallenges: true
  },
  SIMPLE: {
    domain: 'general planning',
    outputFormat: 'structured plan',
    enhancementLevel: 'basic',
    includeIndustryContext: false,
    includeMarketAnalysis: false,
    includeChallenges: false
  }
}

/**
 * Main function to process user input with enhancement
 * @param {string} rawInput - Original user input
 * @param {Function} llmCallFunction - LLM API call function
 * @param {Object} config - Configuration options
 * @returns {Promise<Object>} Processing result
 */
export const processUserInput = async (rawInput, llmCallFunction, config = {}) => {
  const {
    enableEnhancement = true,
    autoDetectNeed = true,
    preset = 'STARTUP_MINDMAP',
    forceEnhancement = false
  } = config

  const result = {
    originalInput: rawInput,
    enhancedPrompt: null,
    wasEnhanced: false,
    analysis: null,
    error: null
  }

  try {
    // Analyze input quality
    result.analysis = analyzeInputQuality(rawInput)
    
    // Determine if enhancement should be applied
    const shouldEnhance = enableEnhancement && (
      forceEnhancement || 
      !autoDetectNeed || 
      result.analysis.needsEnhancement
    )
    
    console.log('DEBUG: Enhancement decision - shouldEnhance:', shouldEnhance)
    console.log('DEBUG: forceEnhancement:', forceEnhancement)
    console.log('DEBUG: enableEnhancement:', enableEnhancement)
    console.log('DEBUG: analysis.needsEnhancement:', result.analysis.needsEnhancement)

    if (shouldEnhance) {
      console.log('DEBUG: Starting enhancement process...')
      const options = ENHANCEMENT_PRESETS[preset] || ENHANCEMENT_PRESETS.STARTUP_MINDMAP
      result.enhancedPrompt = await enhanceUserInput(rawInput, llmCallFunction, options)
      result.wasEnhanced = true
      console.log('DEBUG: Enhancement completed, result:', result.enhancedPrompt)
    } else {
      result.enhancedPrompt = `Create a comprehensive ${ENHANCEMENT_PRESETS[preset]?.outputFormat || 'plan'} for: ${rawInput}`
      result.wasEnhanced = false
    }

    return result
  } catch (error) {
    result.error = error.message
    result.enhancedPrompt = `Create a comprehensive plan for: ${rawInput}`
    return result
  }
}