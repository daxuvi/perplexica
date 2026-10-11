const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

// Load .env file if exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

const PORT = process.env.PORT || 5000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function serveStatic(req, res) {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.normalize(path.join(PUBLIC_DIR, reqPath));

  // Security check: prevent directory traversal
  if (!filePath.toLowerCase().startsWith(PUBLIC_DIR.toLowerCase())) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Only fallback to index.html for page routes without extensions
      const ext = path.extname(reqPath);
      if (!ext || ext === '.html') {
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${reqPath}`);
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API Endpoint: check if server environment key is present
  if (req.url.startsWith('/api/gemini/info')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      hasServerKey: Boolean(process.env.GEMINI_API_KEY)
    }));
  }

  // API Proxy for Gemini (Direct fetch fallback with env key and streaming)
  if (req.url.startsWith('/api/gemini/generate') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { apiKey: clientApiKey, model = 'gemini-1.5-pro', requestData, stream = false } = payload;
        const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

        if (!apiKey) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing apiKey. Vui lòng nhập API Key trong Cài đặt hoặc thiết lập biến GEMINI_API_KEY.' }));
        }

        const endpoint = stream ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}key=${apiKey}`;
        const dataString = JSON.stringify(requestData);

        const urlObj = new URL(targetUrl);
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(dataString)
          }
        };

        if (stream) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });

          const apiReq = https.request(options, apiRes => {
            apiRes.on('data', chunk => {
              res.write(chunk);
            });
            apiRes.on('end', () => {
              res.end();
            });
          });

          apiReq.on('error', err => {
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
          });

          apiReq.write(dataString);
          apiReq.end();
          return;
        }

        const apiReq = https.request(options, apiRes => {
          let apiData = '';
          apiRes.on('data', chunk => { apiData += chunk; });
          apiRes.on('end', () => {
            res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(apiData);
          });
        });

        apiReq.on('error', err => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });

        apiReq.write(dataString);
        apiReq.end();
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON request' }));
      }
    });
    return;
  }

  // Default: static file server
  serveStatic(req, res);
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`=======================================================`);
  console.log(`  🚀 Perplexica Pro Web App is running!`);
  console.log(`  🌐 URL: ${url}`);
  console.log(`=======================================================`);

  // Auto-open browser in local environment
  if (!process.env.VERCEL) {
    const openCmd = process.platform === 'win32' ? `start ${url}` : `open ${url}`;
    exec(openCmd, () => {});
  }
});
