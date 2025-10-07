// Serverless function for retrieving transcriptions
const { kv } = require('@vercel/kv');
const cors = require('cors');

// CORS middleware setup
const corsMiddleware = cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Handle CORS preflight and main request
module.exports = async (req, res) => {
  // Handle CORS
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session } = req.query;
    
    if (!session) {
      return res.status(400).json({ error: 'Session token required' });
    }

    // Get from Vercel KV (Redis)
    const data = await kv.get(session);
    
    if (!data) {
      return res.status(404).json({ error: 'No transcription found for this session' });
    }
    
    // Delete after retrieval (one-time use)
    await kv.del(session);
    
    return res.status(200).json(JSON.parse(data));
  } catch (err) {
    console.error('Error getting transcription:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};