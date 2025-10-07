// Health check endpoint for Vercel
module.exports = (req, res) => {
  res.status(200).json({ status: 'ok' });
};