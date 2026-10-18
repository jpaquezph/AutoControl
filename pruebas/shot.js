// Captura con espera real: node shot.js <url> <salida.png> [espera_ms] [ancho] [alto] [oscuro 0/1]
const {spawn} = require('child_process'), fs = require('fs'), path = require('path');
const [url, out, wait = '12000', w = '412', h = '880', dark = '0'] = process.argv.slice(2);
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = path.join(__dirname, 'prof-cdp-' + port);
const ed = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], {stdio:'ignore'});
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let tabs; for(let i = 0; i < 40; i++){ try{ tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if(tabs.length) break; }catch(e){} await sleep(250); }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); let id = 0; const pend = {};
  const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({id:i, method, params})); });
  ws.onmessage = e => { const m = JSON.parse(e.data); if(m.id && pend[m.id]){ pend[m.id](m.result || m.error); delete pend[m.id]; } };
  await new Promise(r => ws.onopen = r);
  await cmd('Emulation.setDeviceMetricsOverride', {width:+w, height:+h, deviceScaleFactor:2, mobile:true});
  await cmd('Emulation.setEmulatedMedia', {features:[{name:'prefers-color-scheme', value:dark === '1' ? 'dark' : 'light'}]});
  await cmd('Page.enable'); await cmd('Page.navigate', {url});
  await sleep(+wait);
  const t = await cmd('Runtime.evaluate', {expression:'document.title + " | " + ((document.getElementById("LOG")||{}).textContent||"")', returnByValue:true});
  console.log(t.result.value.slice(0, 400));
  const s = await cmd('Page.captureScreenshot', {format:'png'});
  fs.writeFileSync(out, Buffer.from(s.data, 'base64'));
  ws.close(); ed.kill(); setTimeout(() => { try{ fs.rmSync(prof, {recursive:true, force:true}); }catch(e){} process.exit(0); }, 800);
})().catch(e => { console.error(e); ed.kill(); process.exit(1); });
