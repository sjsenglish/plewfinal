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
  // Try React environment variables first (development)
  if (process.env.REACT_APP_WORDNIK_API_KEY) {
    return process.env.REACT_APP_WORDNIK_API_KEY;
  }

  // Try regular environment variables (should work in some deployments)
  if (process.env.WORDNIK_API_KEY) {
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