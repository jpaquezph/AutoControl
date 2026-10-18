# AutoControl — notas para retomar

App para llevar los controles del auto (kilometraje, service, historial, combustible, patentes,
papeles, mecánicos, gastos) + GPS que cuenta km + mapa con navegación. Mismo estilo que Kakeibo.

## Archivos

| Archivo | Qué es |
|---|---|
| `AutoControl.html` | **La app entera** (HTML + CSS + JS en un solo archivo). Datos en `localStorage` (`autocontrol.v1`), fotos/PDF de papeles en IndexedDB (`autocontrol` / `adjuntos`). |
| `lib/leaflet.*` | Librería del mapa (Leaflet 1.9.4), local para que ande en la APK. |
| `servir.js` | Servidor para probar desde el celular en la WiFi: `node servir.js` → HTTP 8080, HTTPS 8443 (el GPS necesita HTTPS). Solo sirve la app, Leaflet y el APK. |
| `cert/` | Certificado autofirmado para la IP **192.168.0.181**. Si la PC cambia de IP, regenerarlo (comando abajo). |
| `AutoControl.apk` | App Android ya armada. |
| `android/` | Proyecto Android (WebView nativo, sin Gradle). `bash android/build.sh` rearma el APK copiando el HTML actual. |
| `android/autocontrol.keystore` | **Clave de firma del APK. No borrarla**: sin ella no se puede actualizar la app instalada. Contraseña: `autocontrol`. |
| `pruebas/` | Scripts de prueba (Edge headless): `gps-test.js`, `mapa-test.js`, `movil.js` (emula celular contra el servidor), `shot.js` (capturas), `qr.html` (QR para el celular). |

Herramientas instaladas fuera de la carpeta: JDK 17 y Android SDK en `C:\Android`.
Regla de firewall de Windows "AutoControl LAN" abre los puertos 8080 y 8443.

## Cómo usar

- PC: abrir `AutoControl.html`, o `http://localhost:8080` con el servidor corriendo.
- Celular (misma WiFi), con `node servir.js` corriendo:
  - Web con GPS: `https://192.168.0.181:8443` (aceptar el aviso de certificado)
  - APK: `http://192.168.0.181:8080/AutoControl.apk`
- Ventana tamaño celular en la PC:
  `msedge --app=http://localhost:8080/ --user-data-dir="%LOCALAPPDATA%\AutoControl-movil" --window-size=412,880`

## Servicios externos del mapa (gratis, sin API key)

Mapas de Esri (calles / oscuro / satélite), búsqueda con Photon (komoot), lugares cercanos con
Overpass (con Photon de respaldo), rutas paso a paso con OSRM (routing.openstreetmap.de).
CARTO dejó de andar sin clave ("API KEY REQUIRED"). Google Maps integrado requeriría una clave paga.

## Estado al 16/10/2026

Hecho y probado (en Edge simulando celular):
- Todas las secciones, GPS con filtros anti-temblor, km manual que gana sobre el GPS.
- Mapa integrado: búsqueda con sugerencias (prioriza < 60 km), cercanos, rutas auto/a pie,
  navegación con voz y recálculo, recorridos, auto estacionado, mecánicos.
- Patentes: pago en cuotas o anual (cuota 0 = anual).
- Papeles: tipo a elegir (VTV, póliza, carnet, DNI, cédulas…), fotos/PDF adjuntos (fotos achicadas
  a 1800 px), incluidos en el backup.

Pendiente / a verificar:
- Probar la APK en un celular real (cámara, abrir PDF, GPS, voz). Nunca se probó en un dispositivo.
- El usuario estaba probando la web en el celular; esperar su devolución.
- GPS con pantalla bloqueada no cuenta km (haría falta un servicio en primer plano en la APK).
- Los datos no se sincronizan entre web y APK (solo con backup). Ver "Sincronización" abajo.

## 18/10/2026 — APK 1.1 y base para sincronizar

- **Bug corregido en el armado del APK**: en Windows `aapt2 -A` guardaba los assets como
  `assets/www\index.html` (barra invertida) y en Android la app no encontraba la página. Ahora
  `build.sh` los agrega con `jar` y falla si queda alguna barra invertida. La APK anterior (1.0) estaba rota.
- La APK 1.1 sigue sin probarse en un celular real (no hay emulador instalado).

## Sincronización (pendiente, base ya preparada)

Hoy web y APK funcionan por separado (cada una con su `localStorage`). Para sincronizar después,
`save()` ya deja los datos listos para mezclar dos copias:
- cada registro de las colecciones (`COLS`) lleva `mod` = fecha de su última modificación;
- `S.borrados` = `{id: fecha}` de lo eliminado (para que un borrado no "reviva" al mezclar);
- `S.dispositivo` = id de esta copia (`web-…` o `android-…`).
Mezcla prevista: por cada id gana el `mod` más nuevo; si `borrados[id]` es más nuevo que `mod`, se borra.
Falta decidir el transporte (archivo/QR, Google Drive, o un servidor propio). Los adjuntos (IndexedDB) van aparte.

## 18/10/2026 — Versión 1.2 (pedidos después de probar en el celular)

- **El mapa gira con el auto** (rumbo arriba), con el plugin `lib/leaflet-rotate.js` (0.2.8, local para la APK).
  El rumbo sale del GPS (`coords.heading`) o se calcula entre posiciones (`posGps`); parado se mantiene.
  Botón brújula: alterna "gira con el auto" / "norte arriba". El punto azul pasa a flecha.
  Manejando (navegación o GPS contando), si movés el mapa con el dedo vuelve solo a seguir al auto a los 15 s.
- **Odómetro dentro del mapa** (abajo a la izquierda): velocidad + km del auto en vivo (+ km del viaje si el GPS cuenta).
- **Ventanita flotante (solo APK, Android 8+)**: "imagen en imagen". Con el mapa abierto, al apretar Inicio
  la app se achica sola (y hay un botón para achicarla). Muestra mapa, odómetro y la próxima indicación.
  Java: `Android.mapaAbierto(bool)`, `Android.minimizar()`; Android llama a `modoPip(bool)` y la página usa `body.pip`.
  En la web no se puede (Chrome de Android no deja hacer ventanita con una página).
- Prueba: `node pruebas/giro-test.js [pip 0/1] [nav]` genera `t-giro.html` y se captura con `pruebas/shot.js`.
- Sin probar en un celular real todavía: la ventanita y que el GPS siga andando dentro de ella.

## Comandos útiles

```bash
# Rearmar el APK después de tocar AutoControl.html
bash android/build.sh

# Regenerar el certificado si cambia la IP (reemplazar la IP)
openssl req -x509 -newkey rsa:2048 -nodes -days 825 -keyout cert/key.pem -out cert/cert.pem \
  -subj "/CN=AutoControl" -addext "subjectAltName=IP:192.168.0.181,DNS:localhost"
```

## Repositorio y versiones

GitHub (privado): https://github.com/jpaquezph/AutoControl
- `main` siempre en la última versión; una rama `vX.Y` por versión (hoy `v1.1`).
- Versión nueva: subir `APP_VERSION` en `AutoControl.html`, crear la rama `vX.Y`, trabajar ahí,
  y al cerrarla llevarla a `main`. `build.sh` toma la versión del HTML.
- No están en el repo (a propósito): `android/autocontrol.keystore`, `cert/` y los `.apk`.
