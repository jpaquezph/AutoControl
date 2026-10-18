// Genera t-giro.html (en la carpeta de la app): GPS simulado que va al norte y dobla al este.
// Prueba que el mapa gire con el auto, el odómetro dentro del mapa y la ventanita (modoPip).
// Uso: node pruebas/giro-test.js [pip 0/1]  y después  node pruebas/shot.js file:///.../t-giro.html salida.png 9000 [ancho] [alto]
const fs = require('fs'), path = require('path');
const pip = process.argv[2] === '1';
const RAIZ = path.join(__dirname, '..');
let h = fs.readFileSync(path.join(RAIZ, 'AutoControl.html'), 'utf8');
const pre = `<script>window.onerror=function(m,s,l){document.title="ERR "+m+" @"+l};try{localStorage.clear()}catch(e){}
window._pos={latitude:-34.6037,longitude:-58.3816,accuracy:8,speed:null};window._subs=[];
Object.defineProperty(navigator,"geolocation",{value:{watchPosition(s){window._subs.push(s);setTimeout(()=>s({coords:window._pos,timestamp:Date.now()}),50);return window._subs.length},clearWatch(i){window._subs[i-1]=null},getCurrentPosition(s){s({coords:window._pos,timestamp:Date.now()})}}});
window._mover=(lat,lng,sp)=>{window._pos={latitude:lat,longitude:lng,accuracy:8,speed:sp==null?10:sp};window._subs.forEach(s=>s&&s({coords:window._pos,timestamp:Date.now()}))};</script>`;
h = h.replace('<script>\n"use strict";', pre + '<script>\n"use strict";');
h = h.replace('</body>', `<script>
const log=[], dormir=ms=>new Promise(r=>setTimeout(r,ms)), r0=x=>Math.round(x);
const set=(k,v)=>{document.getElementById("f_"+k).value=v};const submit=()=>document.querySelector("#modal form").requestSubmit();
(async()=>{try{
A.new(null,"vehiculos");set("marca","Fiat");set("modelo","Cronos");set("kmInicial","30.000");set("fechaAlta","2026-01-10");submit();
gpsIniciar(); A.mapaAbrir(); await dormir(500);
log.push("rotate="+!!M.map.setBearing+" odo="+document.getElementById("mapaOdo").innerText.replace(/\\s+/g," "));
let lat=-34.6037,lng=-58.3816;
for(let i=0;i<15;i++){ lat+=0.00014; _mover(lat,lng); await dormir(60); }
await dormir(800); log.push("norte rumbo="+r0(G.pos.rumbo)+" giro="+r0(giroMapa()));
for(let i=0;i<15;i++){ lng+=0.00017; _mover(lat,lng); await dormir(60); }
await dormir(1000); log.push("este rumbo="+r0(G.pos.rumbo)+" giro="+r0(giroMapa())+" flecha="+M.yoFlecha);
_mover(lat,lng,0); await dormir(300); log.push("parado rumbo="+r0(G.pos.rumbo));
log.push("odo="+document.getElementById("mapaOdo").innerText.replace(/\\s+/g," "));
A.mapaRumbo(); await dormir(1200); log.push("norte-arriba giro="+r0(giroMapa())); A.mapaRumbo(); await dormir(1200); log.push("vuelve giro="+r0(giroMapa()));
${process.argv[3] === 'nav' ? 'M.sel={lat:lat,lng:lng+0.004,nombre:"Destino"}; M.ruta={dist:600,dur:120,linea:[[lat,lng],[lat,lng+0.004]],pasos:[{ins:"Dirigite al este",dist:300,loc:{lat:lat,lng:lng},tipo:"depart",mod:""},{ins:"Girá a la izquierda en Avenida Corrientes",dist:300,loc:{lat:lat,lng:lng+0.002},tipo:"turn",mod:"left"},{ins:"Llegaste",dist:0,loc:{lat:lat,lng:lng+0.004},tipo:"arrive",mod:""}]}; M.trazo.clearLayers(); navIniciar(); await dormir(300);' : ''}
${pip ? 'modoPip(true); await dormir(600); log.push("pip="+document.body.classList.contains("pip")+" win="+innerWidth+"x"+innerHeight+" mapa="+JSON.stringify(document.getElementById("mapa").getBoundingClientRect())+" odo="+JSON.stringify(document.getElementById("mapaOdo").getBoundingClientRect())+" size="+M.map.getSize());' : ''}
}catch(e){log.push("EXC "+e.message+" | "+e.stack)}
finally{const p=document.createElement("pre");p.id="LOG";p.style.display="none";p.textContent=log.join(" || ");document.body.append(p);document.title="LISTO";}
})();
</script></body>`);
fs.writeFileSync(path.join(RAIZ, 't-giro.html'), h);
