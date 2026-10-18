# AutoControl

App para llevar los controles del auto: kilometraje, service, historial, combustible, patentes,
papeles, mecánicos y gastos, más GPS que cuenta km y mapa con navegación.

Hay dos versiones que hoy funcionan por separado (la sincronización de datos viene más adelante):

- **Web**: `AutoControl.html`, un solo archivo. Se abre en el navegador.
- **Android**: APK que envuelve la misma página en un WebView (`android/`).

## Ramas

- `main`: siempre tiene la última versión.
- `vX.Y`: una rama por versión (por ejemplo `v1.1`).

La versión se define en un solo lugar: `APP_VERSION` en `AutoControl.html`. El APK la toma de ahí.

## Armar el APK

```bash
bash android/build.sh   # genera AutoControl.apk
```

Requiere el JDK 17 y el SDK de Android en `C:\Android`. La clave de firma
(`android/autocontrol.keystore`) **no está en el repo**: guardala aparte, porque sin ella no se puede
actualizar la app ya instalada en el celular.

Más detalles en `NOTAS.md`.
