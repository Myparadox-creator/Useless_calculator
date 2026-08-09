const fs = require('fs');
const path = require('path');

let htmlContent = '';
try {
  htmlContent = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
} catch (e) {
  htmlContent = '<!DOCTYPE html><html><body><h1>CalcPro Calculator</h1></body></html>';
}

module.exports = (req, res) => {
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
