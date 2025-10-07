// Serverless function for saving transcriptions
const { kv } = require('@vercel/kv');
const cors = require('cors');

// CORS middleware setup
const corsMiddleware = cors({
  origin: '*', // Allow all origins
  methods: ['POST', 'OPTIONS'],
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

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionToken, text } = req.body;
    
    if (!sessionToken || !text) {
      return res.status(400).json({ error: 'Session token and text are required' });
    }

    const payload = { text, timestamp: Date.now() };
    
    // Store in Vercel KV (Redis)
    await kv.set(sessionToken, JSON.stringify(payload), { ex: 86400 }); // 24 hour expiry
    
    console.log(`[SAVE] Transcription saved for session: ${sessionToken}`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error saving transcription:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};