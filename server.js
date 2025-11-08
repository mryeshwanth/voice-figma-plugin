const express = require('express');
const cors = require('cors');
const path = require('path');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Redis client
let redisClient;
const initRedis = async () => {
  try {
    // Railway provides REDIS_URL environment variable
    const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL;
    
    if (redisUrl) {
      redisClient = redis.createClient({
        url: redisUrl
      });
    } else {
      // Fallback to local Redis for development
      redisClient = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        },
        password: process.env.REDIS_PASSWORD
      });
    }

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.on('connect', () => console.log('Redis Client Connected'));
    
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Continue without Redis - API will return errors but server won't crash
  }
};

// Initialize Redis on startup
initRedis();

// Root route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Figma Voice Transcription API',
    endpoints: {
      health: '/api/health',
      save: '/api/save-transcription',
      get: '/api/get-transcription',
      transcription: '/transcription.html'
    }
  });
});

// Serve static files from web directory
app.use('/web', express.static(path.join(__dirname, 'web')));

// Route: /transcription.html -> /web/transcription.html
app.get('/transcription.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'transcription.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API: Save transcription
app.post('/api/save-transcription', async (req, res) => {
  try {
    const { sessionToken, text } = req.body;
    
    if (!sessionToken || !text) {
      return res.status(400).json({ error: 'Session token and text are required' });
    }

    if (!redisClient) {
      console.error('[SAVE] Redis client not initialized');
      return res.status(503).json({ error: 'Storage service unavailable: Redis not connected' });
    }

    if (!redisClient.isOpen) {
      console.error('[SAVE] Redis client not open, attempting to reconnect...');
      try {
        await redisClient.connect();
      } catch (reconnectErr) {
        console.error('[SAVE] Failed to reconnect to Redis:', reconnectErr);
        return res.status(503).json({ error: 'Storage service unavailable: Cannot connect to Redis' });
      }
    }

    const payload = { text, timestamp: Date.now() };
    
    // Store in Redis with 24 hour expiry
    await redisClient.setEx(sessionToken, 86400, JSON.stringify(payload));
    
    console.log(`[SAVE] Transcription saved for session: ${sessionToken}`);
    return res.status(200).json({ success: true, message: 'Transcription saved successfully' });
  } catch (err) {
    console.error('Error saving transcription:', err);
    return res.status(500).json({ error: err.message || 'Internal server error', details: 'Failed to save transcription' });
  }
});

// API: Get transcription
app.get('/api/get-transcription', async (req, res) => {
  try {
    const { session } = req.query;
    
    if (!session) {
      return res.status(400).json({ error: 'Session token required' });
    }

    if (!redisClient) {
      console.error('[GET] Redis client not initialized');
      return res.status(503).json({ error: 'Storage service unavailable: Redis not connected' });
    }

    if (!redisClient.isOpen) {
      console.error('[GET] Redis client not open, attempting to reconnect...');
      try {
        await redisClient.connect();
      } catch (reconnectErr) {
        console.error('[GET] Failed to reconnect to Redis:', reconnectErr);
        return res.status(503).json({ error: 'Storage service unavailable: Cannot connect to Redis' });
      }
    }

    // Get from Redis
    const data = await redisClient.get(session);
    
    if (!data) {
      return res.status(404).json({ error: 'No transcription found for this session' });
    }
    
    // Delete after retrieval (one-time use)
    await redisClient.del(session);
    
    return res.status(200).json(JSON.parse(data));
  } catch (err) {
    console.error('Error getting transcription:', err);
    return res.status(500).json({ error: err.message || 'Internal server error', details: 'Failed to retrieve transcription' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Redis client status: ${redisClient ? (redisClient.isOpen ? 'Connected' : 'Not connected') : 'Not initialized'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
  process.exit(0);
});

