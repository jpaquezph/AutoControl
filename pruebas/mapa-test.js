// Genera t-mapa.html: abre el mapa con GPS simulado en el Obelisco y prueba busqueda, cercanos, ruta y navegacion contra las APIs reales.
// Uso: node mapa-test.js [paso_final]  (para capturas: se detiene en ese paso)
const fs = require('fs');
const fin = process.argv[2] || '99';
let h = fs.readFileSync('C:/Users/Administrator/Documents/Auto/AutoControl.html', 'utf8');
const pre = `<script>window.onerror=function(m,s,l){document.title="ERR "+m+" @"+l};try{localStorage.clear()}catch(e){}
window._pos={latitude:-34.6037,longitude:-58.3816,accuracy:10,speed:null};window._subs=[];
Object.defineProperty(navigator,"geolocation",{value:{watchPosition(s){window._subs.push(s);setTimeout(()=>s({coords:window._pos,timestamp:Date.now()}),50);return window._subs.length},clearWatch(i){window._subs[i-1]=null},getCurrentPosition(s){s({coords:window._pos,timestamp:Date.now()})}}});
window._mover=(lat,lng,sp)=>{window._pos={latitude:lat,longitude:lng,accuracy:8,speed:sp==null?10:sp};window._subs.forEach(s=>s&&s({coords:window._pos,timestamp:Date.now()}))};</script>`;
h = h.replace('<script>\n"use strict";', pre + '<script>\n"use strict";');
h = h.replace('</body>', `<script>
const FIN=${fin}, log=[], dormir=ms=>new Promise(r=>setTimeout(r,ms));
const set=(k,v)=>{document.getElementById("f_"+k).value=v};const submit=()=>document.querySelector("#modal form").requestSubmit();
const sheet=()=>document.getElementById("mapaSheet").innerText.replace(/\\s+/g," ").slice(0,160);
(async()=>{try{
A.new(null,"vehiculos");set("marca","Fiat");set("modelo","Cronos");set("kmInicial","30.000");set("fechaAlta","2026-01-10");submit();
UI.sec="gps";render();
A.mapaAbrir(); await dormir(400);
log.push("1 abierto="+mapaVisible()+" yo="+!!M.yo+" seguir="+M.seguir+" chips="+document.querySelectorAll(".mchip").length);
if(FIN<=1) return;
let t0=Date.now(); await mapaCerca("fuel"); log.push("2 cerca fuel n="+M.res.length+" ("+(Date.now()-t0)+" ms) ej="+(M.res[0]&&M.res[0].nombre+" a "+distA(M.res[0])));
if(FIN<=2) return;
t0=Date.now(); await mapaBuscar("Av. Corrientes 1500, Buenos Aires"); log.push("3 buscar n="+M.res.length+" sel="+(M.sel&&M.sel.nombre)+" ("+(Date.now()-t0)+" ms) sheet="+sheet());
const dest = M.sel || M.res[0]; mapaLugar(dest);
if(FIN<=3) return;
t0=Date.now(); await mapaRuta(dest,"driving"); log.push("4 ruta auto: "+(M.ruta?fDist(M.ruta.dist)+" "+fDurC(M.ruta.dur)+" pasos="+M.ruta.pasos.length+" | "+M.ruta.pasos.slice(0,4).map(p=>p.ins).join(" / "):"FALLO "+sheet())+" ("+(Date.now()-t0)+" ms)");
await mapaRuta(dest,"foot"); log.push("4b ruta a pie: "+(M.ruta?fDist(M.ruta.dist)+" "+fDurC(M.ruta.dur):"FALLO"));
await mapaRuta(dest,"driving");
if(FIN<=4) return;
navIniciar(); log.push("5 nav paso="+M.nav.i+" clase="+document.getElementById("mapa").classList.contains("navegando")+" sheet="+sheet());
const L2=M.ruta.linea; for(let i=0;i<L2.length*0.5;i+=1){ _mover(L2[i][0],L2[i][1]); }
await dormir(200); log.push("6 a mitad paso="+(M.nav&&M.nav.i)+"/"+M.ruta.pasos.length+" sheet="+sheet());
if(FIN<=6) return;
const ruta1=M.ruta; M.rerutaT=0; _mover(-34.6100,-58.3700); await dormir(4000); log.push("7 desvio recalculo="+(M.ruta!==ruta1)+" paso="+(M.nav&&M.nav.i)+" sheet="+sheet());
const L3=M.ruta.linea; for(let i=0;i<L3.length;i++) _mover(L3[i][0],L3[i][1]); _mover(dest.lat,dest.lng,0); await dormir(200);
log.push("8 llegada nav="+!!M.nav+" sheet="+sheet());
if(FIN<=8) return;
A.mapaCapa(); log.push("9 capa="+M.capa); A.mapaCapa();
S.viajes.push({id:"v1",vid:S.vid,fecha:hoy(),inicio:Date.now()-1800000,fin:Date.now(),dist:5400,kmInicio:30000,kmFinal:30005.4,puntos:L2.slice(0, 80)});
A.mapaCerrar(); await dormir(300); log.push("10 cerrado="+!mapaVisible()+" watch="+M.watch);
A.verViaje("v1"); await dormir(300); log.push("11 recorrido sheet="+sheet());
if(FIN<=11) return;
A.mapaCerrar(); await dormir(300);
S.mecanicos.push({id:"m1",nombre:"Taller Pepe",direccion:"Av. Rivadavia 5000, Buenos Aires"}); await A.irMec("m1"); await dormir(6000);
log.push("12 mecanico sel="+(M.sel&&M.sel.nombre)+" ruta="+(M.ruta?fDist(M.ruta.dist):"no")+" sheet="+sheet());
if(FIN<=12) return;
}catch(e){log.push("EXC "+e.message+" | "+e.stack)}
finally{const p=document.createElement("pre");p.id="LOG";p.style.display="none";p.textContent=log.join(" || ");document.body.append(p);document.title="LISTO";}
})();
</script></body>`);
fs.writeFileSync('t-mapa.html', h);
