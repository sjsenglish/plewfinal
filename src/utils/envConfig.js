// Environment configuration utility
// Handles API keys for both development and production environments

// For Vercel deployment, we'll try multiple approaches to get the OpenAI key
export const getOpenAIKey = () => {
  // Try React environment variables first (development)
  if (process.env.REACT_APP_OPENAI_API_KEY) {
    return process.env.REACT_APP_OPENAI_API_KEY;
  }

  // Try regular environment variables (should work in some deployments)
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // Try window variables (can be set by server-side injection)
  if (typeof window !== 'undefined') {
    if (window.REACT_APP_OPENAI_API_KEY) {
      return window.REACT_APP_OPENAI_API_KEY;
    }
    if (window.OPENAI_API_KEY) {
      return window.OPENAI_API_KEY;
    }
  }

  // Try to get from global variables set by build process
  if (typeof global !== 'undefined') {
    if (global.REACT_APP_OPENAI_API_KEY) {
      return global.REACT_APP_OPENAI_API_KEY;
    }
    if (global.OPENAI_API_KEY) {
      return global.OPENAI_API_KEY;
    }
  }

  return null;
};

// Get Wordnik API Key
export const getWordnikAPIKey = () => {
  // Debug environment variables (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Environment check:', {
      REACT_APP_WORDNIK_API_KEY: !!process.env.REACT_APP_WORDNIK_API_KEY,
      WORDNIK_API_KEY: !!process.env.WORDNIK_API_KEY,
      NODE_ENV: process.env.NODE_ENV
    });
  }

  // Try React environment variables first (required for client-side)
  if (process.env.REACT_APP_WORDNIK_API_KEY) {
    console.log('✅ Found Wordnik API key via REACT_APP_WORDNIK_API_KEY');
    return process.env.REACT_APP_WORDNIK_API_KEY;
  }

  // Try regular environment variables (fallback, won't work in browser)
  if (process.env.WORDNIK_API_KEY) {
    console.log('⚠️ Found Wordnik API key via WORDNIK_API_KEY (may not work in browser)');
    return process.env.WORDNIK_API_KEY;
  }

  // Try window variables (can be set by server-side injection)
  if (typeof window !== 'undefined') {
    if (window.REACT_APP_WORDNIK_API_KEY) {
      return window.REACT_APP_WORDNIK_API_KEY;
    }
    if (window.WORDNIK_API_KEY) {
      return window.WORDNIK_API_KEY;
    }
  }

  // Try to get from global variables set by build process
  if (typeof global !== 'undefined') {
    if (global.REACT_APP_WORDNIK_API_KEY) {
      return global.REACT_APP_WORDNIK_API_KEY;
    }
    if (global.WORDNIK_API_KEY) {
      return global.WORDNIK_API_KEY;
    }
  }

  console.warn(`
  ⚠️  Wordnik API Key Not Found
  
  For Wordnik vocabulary features, add your API key to Vercel:
  Environment Variable Name: REACT_APP_WORDNIK_API_KEY
  Environment Variable Value: your_wordnik_api_key_here
  
  Note: Client-side React apps require REACT_APP_ prefix for environment variables.
  `);

  return null;
};

// For development, warn about missing keys
export const validateEnvironment = () => {
  const openaiKey = getOpenAIKey();
  
  if (!openaiKey) {
    console.warn(`
    ⚠️  OpenAI API Key Configuration Required
    
    For full vocabulary features, add your OpenAI API key:
    
    Development (.env):
    REACT_APP_OPENAI_API_KEY=your_key_here
    
    Vercel (Environment Variables):
    REACT_APP_OPENAI_API_KEY=your_key_here
    
    Vocabulary features will work with limited functionality without the key.
    `);
    return false;
  }

  return true;
};

// Export configuration object
export const config = {
  openai: {
    apiKey: getOpenAIKey(),
    available: !!getOpenAIKey()
  },
  wordnik: {
    apiKey: getWordnikAPIKey(),
    available: !!getWordnikAPIKey()
  }
};

export default config;