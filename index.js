const http = require('http');
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'index.html');
let htmlContent = '';

try {
  htmlContent = fs.readFileSync(HTML_PATH, 'utf8');
} catch (e) {
  htmlContent = '<!DOCTYPE html><html><body><h1>Error loading calculator</h1></body></html>';
}

// Request handler for both standalone server and Vercel Serverless Function
const handler = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=0, must-revalidate'
  });
  res.end(htmlContent);
};

// If executed directly in Node
if (require.main === module) {
  const PORT = process.env.PORT || 8888;
  const server = http.createServer(handler);
  server.listen(PORT, () => {
    console.log(`CalcPro server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel Node.js runtime / Serverless entrypoint
module.exports = handler;
