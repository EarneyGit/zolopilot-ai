/**
 * Setup Validation Utility
 * Helps users validate their environment configuration
 */

import { initializeSecurity } from '../config/security.js';

/**
 * Validates the complete application setup
 * @returns {Object} Validation results with detailed feedback
 */
export const validateSetup = () => {
  const results = {
    overall: { status: 'success', issues: [] },
    firebase: { status: 'success', issues: [] },
    apiKeys: { status: 'success', issues: [] },
    security: { status: 'success', issues: [] }
  };

  // Run security validation
  const securityStatus = initializeSecurity();

  // Check Firebase configuration
  if (!securityStatus.environment.valid) {
    results.firebase.status = 'error';
    results.firebase.issues = securityStatus.environment.missing.map(env => 
      `Missing environment variable: ${env}`
    );
    results.overall.issues.push('Firebase configuration incomplete');
  }

  // Check API keys
  if (!securityStatus.apiKeys.valid) {
    results.apiKeys.status = 'error';
    results.apiKeys.issues.push('No valid LLM API keys configured');
    results.overall.issues.push('LLM API keys required for AI functionality');
  } else {
    results.apiKeys.availableProviders = securityStatus.apiKeys.availableProviders;
  }

  // Check for placeholder values
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (geminiKey && geminiKey.includes('your_') || geminiKey === 'your_gemini_api_key_here') {
    results.apiKeys.status = 'warning';
    results.apiKeys.issues.push('Gemini API key appears to be a placeholder');
  }

  if (openaiKey && openaiKey.includes('your_') || openaiKey === 'sk-your_openai_key_here') {
    results.apiKeys.status = 'warning';
    results.apiKeys.issues.push('OpenAI API key appears to be a placeholder');
  }

  if (anthropicKey && anthropicKey.includes('your_') || anthropicKey === 'sk-ant-your_anthropic_key_here') {
    results.apiKeys.status = 'warning';
    results.apiKeys.issues.push('Anthropic API key appears to be a placeholder');
  }

  // Overall status
  if (results.firebase.status === 'error' || results.apiKeys.status === 'error') {
    results.overall.status = 'error';
  } else if (results.firebase.status === 'warning' || results.apiKeys.status === 'warning') {
    results.overall.status = 'warning';
  }

  return results;
};

/**
 * Displays validation results in console with colored output
 * @param {Object} results - Validation results from validateSetup()
 */
export const displayValidationResults = (results) => {
  console.group('🔧 ZoloPilot AI - Setup Validation');
  
  // Overall status
  const statusEmoji = {
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`${statusEmoji[results.overall.status]} Overall Status: ${results.overall.status.toUpperCase()}`);
  
  if (results.overall.issues.length > 0) {
    console.log('\n📋 Issues to resolve:');
    results.overall.issues.forEach(issue => console.log(`  • ${issue}`));
  }

  // Firebase status
  console.log(`\n🔥 Firebase: ${statusEmoji[results.firebase.status]}`);
  if (results.firebase.issues.length > 0) {
    results.firebase.issues.forEach(issue => console.log(`  • ${issue}`));
  }

  // API Keys status
  console.log(`\n🤖 API Keys: ${statusEmoji[results.apiKeys.status]}`);
  if (results.apiKeys.availableProviders) {
    console.log(`  Available providers: ${results.apiKeys.availableProviders.join(', ')}`);
  }
  if (results.apiKeys.issues.length > 0) {
    results.apiKeys.issues.forEach(issue => console.log(`  • ${issue}`));
  }

  // Recommendations
  if (results.overall.status !== 'success') {
    console.log('\n💡 Next Steps:');
    
    if (results.firebase.status === 'error') {
      console.log('  1. Check your .env file for missing Firebase variables');
    }
    
    if (results.apiKeys.status === 'error' || results.apiKeys.status === 'warning') {
      console.log('  2. Get API keys from:');
      console.log('     • Gemini: https://makersuite.google.com/app/apikey');
      console.log('     • OpenAI: https://platform.openai.com/api-keys');
      console.log('     • Anthropic: https://console.anthropic.com/');
      console.log('  3. Update your .env file with actual API keys');
      console.log('  4. Restart the development server');
    }
  } else {
    console.log('\n🎉 Setup is complete! You can now use all features.');
  }
  
  console.groupEnd();
};

/**
 * Runs validation and displays results automatically
 */
export const runSetupValidation = () => {
  const results = validateSetup();
  displayValidationResults(results);
  return results;
};

/**
 * Test API connectivity (basic check)
 * @param {string} provider - API provider to test ('gemini', 'openai', 'anthropic')
 * @returns {Promise<boolean>} Whether the API key appears to be valid
 */
export const testApiConnectivity = async (provider) => {
  const apiKey = {
    gemini: import.meta.env.VITE_GEMINI_API_KEY,
    openai: import.meta.env.VITE_OPENAI_API_KEY,
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY
  }[provider];

  if (!apiKey || apiKey.includes('your_')) {
    console.warn(`${provider} API key not configured or is placeholder`);
    return false;
  }

  // Basic format validation
  const formatChecks = {
    gemini: /^AIza[0-9A-Za-z\-_]{35}$/,
    openai: /^sk-[a-zA-Z0-9]{48,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9\-_]{95,}$/
  };

  const isValidFormat = formatChecks[provider]?.test(apiKey);
  
  if (!isValidFormat) {
    console.warn(`${provider} API key format appears invalid`);
    return false;
  }

  console.log(`${provider} API key format is valid`);
  return true;
};