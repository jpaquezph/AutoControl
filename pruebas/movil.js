// Emula un celular (tactil + GPS) contra el servidor real y ejecuta pasos.
// node movil.js <url> <prefijo_capturas> <pasos.json>
// pasos: [{js:"..."} | {esperar:ms} | {foto:"nombre"} | {arrastrar:[x1,y1,x2,y2]} | {tocar:[x,y]} | {escribir:"texto"}]
const {spawn} = require('child_process'), fs = require('fs'), path = require('path');
const [url, pre, pasosF] = process.argv.slice(2);
const pasos = JSON.parse(fs.readFileSync(pasosF, 'utf8'));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500), prof = path.join(__dirname, 'prof-m-' + port);
const ed = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--ignore-certificate-errors', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], {stdio:'ignore'});
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let tabs; for(let i = 0; i < 40; i++){ try{ tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if(tabs.length) break; }catch(e){} await sleep(250); }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); let id = 0; const pend = {};
  const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({id:i, method, params})); });
  const logs = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if(m.id && pend[m.id]){ pend[m.id](m.result || m.error); delete pend[m.id]; }
    if(m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(m.params.exceptionDetails).slice(0, 300));
    if(m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('console.error ' + JSON.stringify(m.params.args).slice(0, 200));
    if(m.method === 'Network.loadingFailed') logs.push('NETFAIL ' + m.params.errorText + ' ' + (m.params.blockedReason || ''));
  };
  await new Promise(r => ws.onopen = r);
  await cmd('Runtime.enable'); await cmd('Network.enable');
  await cmd('Emulation.setDeviceMetricsOverride', {width:393, height:780, deviceScaleFactor:2, mobile:true});
  await cmd('Emulation.setTouchEmulationEnabled', {enabled:true, maxTouchPoints:5});
  await cmd('Emulation.setUserAgentOverride', {userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36'});
  await cmd('Browser.grantPermissions', {permissions:['geolocation'], origin:new URL(url).origin});
  await cmd('Emulation.setGeolocationOverride', {latitude:-34.6037, longitude:-58.3816, accuracy:12});
  await cmd('Page.enable'); await cmd('Page.navigate', {url}); await sleep(3000);
  const touch = (type, x, y) => cmd('Input.dispatchTouchEvent', {type, touchPoints:type === 'touchEnd' ? [] : [{x, y}]});
  for(const p of pasos){
    if(p.js){ const r = await cmd('Runtime.evaluate', {expression:p.js, awaitPromise:true, returnByValue:true}); const v = r.result ? r.result.value : r; if(v !== undefined) console.log('js>', typeof v === 'string' ? v : JSON.stringify(v)); }
    if(p.esperar) await sleep(p.esperar);
    if(p.foto){ const s = await cmd('Page.captureScreenshot', {format:'png'}); fs.writeFileSync(`${pre}-${p.foto}.png`, Buffer.from(s.data, 'base64')); }
    if(p.tocar){ await touch('touchStart', ...p.tocar); await sleep(60); await touch('touchEnd'); }
    if(p.arrastrar){ const [x1, y1, x2, y2] = p.arrastrar; await touch('touchStart', x1, y1); for(let k = 1; k <= 12; k++){ await touch('touchMove', x1 + (x2 - x1) * k / 12, y1 + (y2 - y1) * k / 12); await sleep(16); } await touch('touchEnd'); }
    if(p.escribir) await cmd('Input.insertText', {text:p.escribir});
    if(p.tecla) { await cmd('Input.dispatchKeyEvent', {type:'keyDown', key:p.tecla, code:p.tecla, windowsVirtualKeyCode:13, text:'\r'}); await cmd('Input.dispatchKeyEvent', {type:'keyUp', key:p.tecla, code:p.tecla, windowsVirtualKeyCode:13}); }
  }
  logs.forEach(l => console.log(l));
  ws.close(); ed.kill(); setTimeout(() => { try{ fs.rmSync(prof, {recursive:true, force:true}); }catch(e){} process.exit(0); }, 800);
})().catch(e => { console.error(e); ed.kill(); process.exit(1); });
