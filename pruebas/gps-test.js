const fs=require("fs");let h=fs.readFileSync("C:/Users/Administrator/Documents/Auto/AutoControl.html","utf8");
const pre=`<script>window.onerror=function(m,s,l){document.title="ERR "+m+" @"+l};try{localStorage.clear()}catch(e){}
Object.defineProperty(navigator,"geolocation",{value:{watchPosition(s,e,o){window._s=s;window._e=e;return 7},clearWatch(){window._cleared=1},getCurrentPosition(s){s({coords:{latitude:-34.6,longitude:-58.4,accuracy:12,speed:null},timestamp:Date.now()})}}});</script>`;
h=h.replace("<script>\n\"use strict\";",pre+"<script>\n\"use strict\";");
h=h.replace("</body>",`<script>
const log=[];const set=(k,v)=>{document.getElementById("f_"+k).value=v};const submit=()=>document.querySelector("#modal form").requestSubmit();
try{
A.new(null,"vehiculos");set("marca","Fiat");set("modelo","Cronos");set("kmInicial","30.000");set("fechaAlta","2026-01-10");submit();
A.gpsIniciar();log.push("on="+gpsOn()+" sec="+UI.sec+" side="+!!document.querySelector(".gps-side.on"));
let t=Date.now(), lat=-34.6, lng=-58.4; const send=(la,ln,acc,sp,dt)=>{t+=dt;window._s({coords:{latitude:la,longitude:ln,accuracy:acc,speed:sp},timestamp:t})};
send(lat,lng,8,0,1000);
for(let i=0;i<20;i++) send(lat+(Math.random()-.5)*0.00008,lng+(Math.random()-.5)*0.00008,8,0.1,1000); // quieto con temblor ±4 m
log.push("tras quieto dist="+S.gpsActivo.dist.toFixed(1));
for(let i=1;i<=250;i++){ send(lat+i*0.00018,lng,8,14,1500); } // ~20 m por punto => ~5 km
log.push("tras manejar dist="+(S.gpsActivo.dist/1000).toFixed(3)+" km puntos="+S.gpsActivo.puntos.length);
send(lat+250*0.00018+0.001,lng,120,14,1500); log.push("señal mala ignorada dist="+(S.gpsActivo.dist/1000).toFixed(3));
send(lat+1,lng,8,14,1000); log.push("salto ignorado dist="+(S.gpsActivo.dist/1000).toFixed(3));
log.push("live dist txt="+document.getElementById("gpsDist").textContent+" odo="+document.getElementById("gpsOdo").textContent+" mini="+!!MINI.gpsMini+" mk="+!!(MINI.gpsMini&&MINI.gpsMini.mk));
log.push("persistido="+!!JSON.parse(localStorage.getItem("autocontrol.v1")||"{}").gpsActivo);
A.gpsTerminar();log.push("detenido="+!gpsOn()+" form="+document.getElementById("f_kmFinal").value);
submit();log.push("viajes="+S.viajes.length+" kmActual="+kmActual(V())+" lectura origen="+S.km[0].origen+" pendiente="+!!S.gpsActivo);
A.new(null,"km");set("km","34.900");submit();log.push("manual menor mismo dia => kmActual="+kmActual(V()));
UI.sec="gps";render();log.push("ruta svg="+!!document.querySelector(".ruta polyline")+" verViaje="+!!document.querySelector("[data-a=verViaje]"));
// recorrido pendiente tras "recargar"
A.gpsIniciar();send(lat,lng,8,0,1000);send(lat+0.005,lng,8,14,40000);gpsDetener();render();log.push("banner="+!!document.querySelector(".banner")+" sidePend="+!!document.querySelector(".gps-side.pend"));
A.gpsIniciar();log.push("bloquea nuevo con pendiente: on="+gpsOn());
A.gpsDescartar();document.getElementById("okConf").click();log.push("descartado="+!S.gpsActivo);
A.estacione();log.push("estacionado="+JSON.stringify(S.estacionado&&[S.estacionado.lat,S.estacionado.lng])+" autoMini="+!!MINI.autoMini);
A.new(null,"mecanicos");set("nombre","Taller X");set("direccion","Av. Mitre 1234, Avellaneda");submit();UI.sec="mecanicos";render();
log.push("mec comoLlegar="+!!document.querySelector("[data-a=irMec]"));
A.fijarMec(S.mecanicos[0].id);document.getElementById("okConf").click();log.push("mec lat="+S.mecanicos[0].lat);
A.del(S.viajes[0].id,"viajes");document.getElementById("okConf").click();log.push("viaje borrado, km gps borrada="+!S.km.some(k=>k.origen==="gps"));
for(const s of SECS.filter(s=>s.k)){UI.sec=s.k;render();}log.push("all sections ok");
}catch(e){log.push("EXC "+e.message+" | "+e.stack)}
const p=document.createElement("pre");p.id="LOG";p.textContent=log.join(" || ");document.body.append(p);
</script></body>`);
fs.writeFileSync("t-gps.html",h);
