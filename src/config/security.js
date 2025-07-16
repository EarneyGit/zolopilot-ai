/**
 * Security Configuration
 * Centralized security settings and validation rules
 */

// Environment validation
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
  
  if (missing.length > 0) {
    console.warn('Missing required environment variables:', missing);
    return {
      valid: false,
      missing
    };
  }

  return {
    valid: true,
    missing: []
  };
};

// API key validation
export const validateApiKeys = () => {
  const apiKeys = {
    gemini: import.meta.env.VITE_GEMINI_API_KEY,
    openai: import.meta.env.VITE_OPENAI_API_KEY,
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY
  };

  const hasAtLeastOne = Object.values(apiKeys).some(key => key && key.length > 0);
  
  if (!hasAtLeastOne) {
    console.warn('No LLM API keys configured. At least one is required.');
    return {
      valid: false,
      message: 'No LLM API keys configured'
    };
  }

  return {
    valid: true,
    availableProviders: Object.entries(apiKeys)
      .filter(([, key]) => key && key.length > 0)
      .map(([provider]) => provider)
  };
};

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development
    "'unsafe-eval'", // Required for Vite in development
    'https://generativelanguage.googleapis.com',
    'https://api.openai.com',
    'https://api.anthropic.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled components
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:'
  ],
  'connect-src': [
    "'self'",
    'https://generativelanguage.googleapis.com',
    'https://api.openai.com',
    'https://api.anthropic.com',
    'https://zolopilot-ai.firebaseapp.com',
    'https://firestore.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://accounts.google.com',
    'https://www.googleapis.com',
    'wss:'
  ],
  'frame-ancestors': ["'none'"]
};

// Generate CSP header string
export const generateCSPHeader = () => {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

// Input validation rules
export const INPUT_VALIDATION = {
  startupIdea: {
    maxLength: 5000,
    minLength: 10,
    pattern: /^[\w\s\-.,!?()]+$/,
    sanitize: true
  },
  mindMapText: {
    maxLength: 1000,
    pattern: /^[\w\s\-.,!?()]+$/,
    sanitize: true
  },
  userId: {
    pattern: /^[a-zA-Z0-9-_]+$/,
    maxLength: 128
  }
};

// Rate limiting configuration
export const RATE_LIMITS = {
  llmCalls: {
    maxPerMinute: 10,
    maxPerHour: 100
  },
  mindMapGeneration: {
    maxPerMinute: 5,
    maxPerHour: 50
  }
};

// Security headers for production
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Initialize security checks
export const initializeSecurity = () => {
  const envCheck = validateEnvironment();
  const apiCheck = validateApiKeys();
  
  if (!envCheck.valid) {
    console.error('Environment validation failed:', envCheck.missing);
  }
  
  if (!apiCheck.valid) {
    console.error('API key validation failed:', apiCheck.message);
  }
  
  return {
    environment: envCheck,
    apiKeys: apiCheck
  };
};