module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { apiKey: clientApiKey, model = 'gemini-1.5-pro', requestData, stream = false } = body;

    // Use Client API Key, or fallback to Vercel Environment Variable GEMINI_API_KEY
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'Chưa có Google Gemini API Key. Vui lòng nhập key trong Cài đặt hoặc cấu hình biến môi trường GEMINI_API_KEY trên Vercel.' 
      });
    }

    const endpoint = stream ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}key=${apiKey}`;

    const apiRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = apiRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value));
      }
      return res.end();
    }

    const data = await apiRes.json();
    return res.status(apiRes.status).json(data);
  } catch (err) {
    console.error('Vercel API Proxy Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
