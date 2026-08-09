const http = require('http');
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'index.html');
let htmlContent = '';

try {
  htmlContent = fs.readFileSync(HTML_PATH, 'utf8');
} catch (e) {
  htmlContent = '<!DOCTYPE html><html><body><h1>CalcPro Calculator</h1></body></html>';
}

const handler = (req, res) => {
  if (res.setHeader) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  if (res.writeHead) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    });
  }
  if (res.status && typeof res.status === 'function') {
    return res.status(200).send(htmlContent);
  }
  res.end(htmlContent);
};

if (require.main === module) {
  const PORT = process.env.PORT || 8888;
  const server = http.createServer(handler);
  server.listen(PORT, () => {
    console.log(`CalcPro server running on http://localhost:${PORT}`);
  });
}

module.exports = handler;
