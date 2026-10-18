// Sirve AutoControl.html en la red local para abrirla desde el celular.
// Uso: node servir.js   (HTTP en 8080, HTTPS en 8443 — el GPS necesita HTTPS)
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), os = require('os');

const DIR = __dirname, HTTP_PORT = 8080, HTTPS_PORT = 8443;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.apk': 'application/vnd.android.package-archive' };
// Solo se sirve la app, Leaflet y el APK (nunca la clave de firma ni el certificado).
const PERMITIDOS = /^\/(AutoControl\.html|AutoControl\.apk|lib\/leaflet\.(js|css))$/;

function app(req, res) {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || p === '') p = '/AutoControl.html';
  if (!PERMITIDOS.test(p)) { res.writeHead(404); return res.end('No encontrado'); }
  const f = path.join(DIR, p);
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
  console.log(new Date().toLocaleTimeString(), req.socket.remoteAddress, req.method, req.url);
}

const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);

http.createServer(app).listen(HTTP_PORT, '0.0.0.0');
https.createServer({ key: fs.readFileSync(path.join(DIR, 'cert/key.pem')), cert: fs.readFileSync(path.join(DIR, 'cert/cert.pem')) }, app).listen(HTTPS_PORT, '0.0.0.0');

console.log('AutoControl sirviéndose. Desde el celular (misma WiFi):');
ips.forEach(ip => {
  console.log(`  HTTP  (sin GPS): http://${ip}:${HTTP_PORT}`);
  console.log(`  HTTPS (con GPS): https://${ip}:${HTTPS_PORT}`);
  console.log(`  APK Android:     http://${ip}:${HTTP_PORT}/AutoControl.apk`);
});
console.log('Ctrl+C para cortar.');
