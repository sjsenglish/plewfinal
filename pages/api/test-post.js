export default async function handler(req, res) {
  console.log('TEST API Handler called - Method:', req.method, 'URL:', req.url);
  
  // Set proper CORS headers
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://examrizzsearch.com', 'https://www.examrizzsearch.com']
    : ['http://localhost:3000'];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Test endpoint working - GET request received',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    return res.status(200).json({ 
      message: 'Test endpoint working - POST request received',
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ 
    error: 'Method not allowed',
    received: req.method,
    allowed: ['GET', 'POST']
  });
}