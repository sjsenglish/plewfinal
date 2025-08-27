// api/vocabulary/test.js - Simple test endpoint to verify API setup
module.exports = async function handler(req, res) {
  console.log('Test endpoint called with method:', req.method);
  
  try {
    // Test environment variables
    const hasFirebaseVars = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
    const hasAlgoliaVars = !!(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID && process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY);
    
    console.log('Environment check:', {
      hasFirebaseVars,
      hasAlgoliaVars,
      nodeEnv: process.env.NODE_ENV
    });

    return res.status(200).json({
      success: true,
      message: 'API endpoint is working',
      timestamp: new Date().toISOString(),
      environment: {
        hasFirebaseVars,
        hasAlgoliaVars,
        nodeEnv: process.env.NODE_ENV || 'unknown'
      }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Test endpoint failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}