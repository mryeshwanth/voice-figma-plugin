const express = require('express');
const cors = require('cors');
const path = require('path');

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

// In-memory storage for transcriptions
// Format: { sessionToken: { text: string, timestamp: number, expiresAt: number } }
const transcriptions = new Map();

// Cleanup expired entries every hour
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [session, data] of transcriptions.entries()) {
    if (data.expiresAt < now) {
      transcriptions.delete(session);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[CLEANUP] Removed ${cleaned} expired transcription(s)`);
  }
}, 3600000); // Run every hour

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
  res.status(200).json({ 
    status: 'ok',
    storage: 'in-memory',
    activeSessions: transcriptions.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    storage: 'in-memory',
    activeSessions: transcriptions.size,
    timestamp: new Date().toISOString()
  });
});

// API: Save transcription
app.post('/api/save-transcription', (req, res) => {
  try {
    const { sessionToken, text } = req.body;
    
    if (!sessionToken || !text) {
      return res.status(400).json({ error: 'Session token and text are required' });
    }

    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours from now
    
    // Store transcription in memory
    transcriptions.set(sessionToken, {
      text,
      timestamp: now,
      expiresAt
    });
    
    console.log(`[SAVE] Transcription saved for session: ${sessionToken}`);
    return res.status(200).json({ success: true, message: 'Transcription saved successfully' });
  } catch (err) {
    console.error('Error saving transcription:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// API: Get transcription
app.get('/api/get-transcription', (req, res) => {
  try {
    const { session } = req.query;
    
    if (!session) {
      return res.status(400).json({ error: 'Session token required' });
    }

    // Get from memory
    const data = transcriptions.get(session);
    
    if (!data) {
      return res.status(404).json({ error: 'No transcription found for this session' });
    }

    // Check if expired
    if (data.expiresAt < Date.now()) {
      transcriptions.delete(session);
      return res.status(404).json({ error: 'Transcription has expired' });
    }
    
    // Delete after retrieval (one-time use)
    transcriptions.delete(session);
    
    return res.status(200).json({ text: data.text, timestamp: data.timestamp });
  } catch (err) {
    console.error('Error getting transcription:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Using in-memory storage for transcriptions');
});
