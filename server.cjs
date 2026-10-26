const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (error, data) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': /\.m?js$/.test(file) ? 'text/javascript' : file.endsWith('.wasm') ? 'application/wasm' : file.endsWith('.task') ? 'application/octet-stream' : file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.css') ? 'text/css' : 'text/html' });
    res.end(error ? 'Not found' : data);
  });
});
server.listen(4188, '127.0.0.1', () => console.log('Open http://127.0.0.1:4188 in your browser. Press Ctrl+C to stop.'));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
