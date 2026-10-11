module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    hasServerKey: Boolean(process.env.GEMINI_API_KEY)
  });
};
