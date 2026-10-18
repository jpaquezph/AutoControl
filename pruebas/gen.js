const fs=require("fs");
const h=fs.readFileSync("C:/Users/Administrator/Documents/Auto/AutoControl.html","utf8");
const seed={version:1,tema:process.argv[2]||'claro',vid:'v1',ultimoBackup:null,
vehiculos:[{id:'v1',marca:'Volkswagen',modelo:'Gol Trend',version:'1.6 Highline',anio:2018,patente:'AC123BD',color:'Gris plata',combustible:'Nafta',kmInicial:62000,fechaAlta:'2025-03-01',motor:'CFZ123456',chasis:'9BWAB45U0JT000001'},{id:'v2',marca:'Ford',modelo:'Ka',anio:2012,patente:'KLM456',combustible:'Nafta',kmInicial:110000,fechaAlta:'2026-01-01'}],
km:[{id:'k1',vid:'v1',fecha:'2025-07-10',km:68500},{id:'k2',vid:'v1',fecha:'2026-01-05',km:76200,nota:'Vuelta de vacaciones'},{id:'k3',vid:'v1',fecha:'2026-10-10',km:91800}],
plan:[],historial:[],combustible:[
{id:'c1',vid:'v1',fecha:'2026-09-01',km:89000,litros:40,monto:5200000,moneda:'ARS',lleno:true,estacion:'YPF'},
{id:'c2',vid:'v1',fecha:'2026-09-20',km:89520,litros:38.5,monto:5100000,moneda:'ARS',lleno:true,estacion:'Shell'},
{id:'c3',vid:'v1',fecha:'2026-10-08',km:90050,litros:39,monto:5300000,moneda:'ARS',lleno:true}],
patentes:[{id:'p1',vid:'v1',anio:2026,cuota:1,vence:'2026-02-15',monto:4500000,pagado:'2026-02-10'},{id:'p2',vid:'v1',anio:2026,cuota:2,vence:'2026-04-15',monto:4500000,pagado:'2026-04-12'},{id:'p3',vid:'v1',anio:2026,cuota:3,vence:'2026-06-15',monto:4500000,pagado:'2026-06-14'},{id:'p4',vid:'v1',anio:2026,cuota:4,vence:'2026-08-15',monto:4500000,pagado:null},{id:'p5',vid:'v1',anio:2026,cuota:5,vence:'2026-10-30',monto:4500000,pagado:null}],
papeles:[{id:'d1',vid:'v1',tipo:'VTV / ITV',entidad:'Planta Lanús',desde:'2025-11-02',vence:'2026-11-02',monto:6500000,moneda:'ARS'},{id:'d2',vid:'v1',tipo:'Seguro',entidad:'La Caja',numero:'POL-998877',desde:'2026-01-01',vence:'2027-01-01'},{id:'d3',vid:'',tipo:'Licencia de conducir',numero:'30123456',vence:'2026-09-30'},{id:'d4',vid:'v1',tipo:'Matafuegos',vence:'2027-05-01'}],
mecanicos:[{id:'m1',nombre:'Taller Don Carlos',especialidad:'Mecánica general',telefono:'11 4567-8901',direccion:'Av. Mitre 1234, Avellaneda',notas:'De confianza. Cierra sábados al mediodía.'},{id:'m2',nombre:'Gomería El Rápido',especialidad:'Gomería',telefono:'11 2222-3333'}],
gastos:[{id:'g1',vid:'v1',fecha:'2026-10-01',categoria:'Seguro',desc:'Cuota octubre',monto:8900000,moneda:'ARS'},{id:'g2',vid:'v1',fecha:'2026-09-01',categoria:'Seguro',desc:'Cuota septiembre',monto:8900000,moneda:'ARS'},{id:'g3',vid:'v1',fecha:'2026-05-12',categoria:'Accesorios',desc:'Cubre asientos',monto:12000,moneda:'USD'}]};
const plan=[['Aceite y filtro de aceite',10000,12,82000,'2026-01-20'],['Filtro de aire',20000,24,82000,'2026-01-20'],['Filtro de habitáculo',15000,12,62000,'2025-03-01'],['Correa de distribución',60000,48,35000,'2022-06-01'],['Líquido de frenos',null,24,null,'2024-11-15'],['Bujías',40000,36,null,null]];
plan.forEach((p,i)=>seed.plan.push({id:'s'+i,vid:'v1',nombre:p[0],cadaKm:p[1],cadaMeses:p[2],ultimoKm:p[3],ultimaFecha:p[4]}));
seed.historial=[{id:'h1',vid:'v1',fecha:'2026-01-20',km:82000,tipo:'Service',mecanicoId:'m1',descripcion:'Service de 80.000 km',items:['s0','s1'],costo:18000000,moneda:'ARS',notas:'Aceite 5W30 sintético'},{id:'h2',vid:'v1',fecha:'2026-06-03',km:86500,tipo:'Neumáticos',mecanicoId:'m2',descripcion:'4 cubiertas nuevas + alineación',items:[],costo:68000,moneda:'USD'},{id:'h3',vid:'v1',fecha:'2026-08-22',km:88900,tipo:'Frenos',mecanicoId:'m1',descripcion:'Cambio de pastillas delanteras',items:[],costo:9500000,moneda:'ARS'}];
for(const sec of (process.argv[3]||'resumen').split(',')){
  const pre=`<script>window.onerror=function(m,s,l,c){document.title='ERR '+m+' @'+l;var d=document.createElement('pre');d.id='ERR';d.textContent=m+' @'+l+':'+c;document.body.prepend(d)};try{localStorage.setItem('autocontrol.v1',${JSON.stringify(JSON.stringify(seed))})}catch(e){}</script>`;
  let out=h.replace('<script>\n"use strict";',pre+'<script>\n"use strict";').replace(/render\(\);\n<\/script>/,`UI.sec='${sec}';render();\n</script>`);
  fs.writeFileSync(`t-${sec}.html`,out);
}
