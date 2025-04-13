const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8080;

// In-memory transcription storage (fastest for polling)
const transcriptions = new Map();

// Create a data directory if it doesn't exist (for optional persistence)
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from web folder
app.use('/web', express.static(path.join(__dirname, '..', 'web')));

// Save transcription endpoint
app.post('/api/save-transcription', (req, res) => {
  try {
    const { sessionToken, text } = req.body;
    if (!sessionToken || !text) {
      return res.status(400).json({ error: 'Session token and text are required' });
    }

    const payload = { text, timestamp: Date.now() };
    transcriptions.set(sessionToken, payload);

    // Optional: persist to file
    const filePath = path.join(dataDir, `${sessionToken}.json`);
    fs.writeFileSync(filePath, JSON.stringify(payload));

    console.log(`[SAVE] Transcription saved for session: ${sessionToken}`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error saving transcription:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Polling API to get transcription
app.get('/api/get-transcription', (req, res) => {
  try {
    const { session } = req.query;
    if (!session) return res.status(400).json({ error: 'Session token required' });

    // First check memory
    if (transcriptions.has(session)) {
      const data = transcriptions.get(session);
      transcriptions.delete(session); // One-time fetch
      return res.status(200).json(data);
    }

    // Fallback to file
    const filePath = path.join(dataDir, `${session}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath));
      fs.unlinkSync(filePath); // One-time use
      return res.status(200).json(data);
    }

    res.status(404).json({ error: 'No transcription found for this session' });
  } catch (err) {
    console.error('Error getting transcription:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

// Cleanup expired transcriptions (optional)
setInterval(() => {
  const now = Date.now();
  const MAX_AGE = 24 * 60 * 60 * 1000;

  for (const [session, data] of transcriptions.entries()) {
    if (now - data.timestamp > MAX_AGE) {
      transcriptions.delete(session);
    }
  }

  // Also clean files
  fs.readdirSync(dataDir).forEach(file => {
    const filePath = path.join(dataDir, file);
    try {
      const { mtimeMs } = fs.statSync(filePath);
      if (now - mtimeMs > MAX_AGE) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Error cleaning up ${file}:`, err);
    }
  });
}, 60 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Web interface: http://localhost:${PORT}/web/transcription.html`);
  console.log(`💓 Health check: http://localhost:${PORT}/health`);
});
