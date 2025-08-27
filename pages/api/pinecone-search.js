// pages/api/pinecone-search.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set proper CORS headers (restrict to your domain in production)
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://examrizzsearch.com', 'https://www.examrizzsearch.com']
    : ['http://localhost:3000'];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { embedding, limit = 100 } = req.body;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ error: 'Valid embedding array is required' });
    }

    const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
    const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST;
    
    if (!PINECONE_API_KEY || !PINECONE_INDEX_HOST) {
      return res.status(500).json({ error: 'Pinecone not configured' });
    }

    // Search Pinecone for similar vectors
    const response = await fetch(`https://${PINECONE_INDEX_HOST}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: embedding,
        topK: limit,
        includeMetadata: true,
        includeValues: false
      })
    });

    if (!response.ok) {
      throw new Error(`Pinecone API error: ${response.status}`);
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      matches: data.matches || []
    });
    
  } catch (error) {
    console.error('Error searching Pinecone:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to search vectors'
    });
  }
}