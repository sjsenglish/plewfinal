// pages/api/pinecone-upsert.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set proper CORS headers
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
    const { questionId, embedding, metadata } = req.body;

    if (!questionId || !embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ error: 'questionId and embedding are required' });
    }

    const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
    const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST;
    
    if (!PINECONE_API_KEY || !PINECONE_INDEX_HOST) {
      return res.status(500).json({ error: 'Pinecone not configured' });
    }

    // Upsert to Pinecone
    const response = await fetch(`https://${PINECONE_INDEX_HOST}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors: [{
          id: questionId,
          values: embedding,
          metadata: metadata || {
            question_id: questionId,
            question_preview: metadata?.question?.substring(0, 100) || ''
          }
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Pinecone upsert error: ${response.status}`);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Vector upserted successfully'
    });
    
  } catch (error) {
    console.error('Error upserting to Pinecone:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to upsert vector'
    });
  }
}