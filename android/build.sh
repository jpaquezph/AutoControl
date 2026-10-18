#!/usr/bin/env bash
# Arma AutoControl.apk sin Gradle: aapt2 + javac + d8 + apksigner.
# Uso (Git Bash):  bash android/build.sh
# Requiere el JDK 17 y el SDK de Android en C:\Android (ver rutas abajo).
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$(dirname "$AQUI")"
SDK=/c/Android/sdk
BT=$SDK/build-tools/35.0.0
JAR=$SDK/platforms/android-35/android.jar
export JAVA_HOME="$(ls -d /c/Android/jdk-17* | head -1)"
export PATH="$JAVA_HOME/bin:$PATH"
OUT=$AQUI/build
VERSION_CODE=${VERSION_CODE:-$(date +%y%m%d%H)}
# La versión sale de APP_VERSION en AutoControl.html (así web y APK siempre coinciden)
VERSION_NAME=${VERSION_NAME:-$(grep -oP "const APP_VERSION = '\K[^']+" "$RAIZ/AutoControl.html")}

rm -rf "$OUT" && mkdir -p "$OUT/gen" "$OUT/classes" "$OUT/assets/www/lib"

# La app web va dentro del APK como assets/www/index.html
cp "$RAIZ/AutoControl.html" "$OUT/assets/www/index.html"
cp "$RAIZ/lib/leaflet.js" "$RAIZ/lib/leaflet.css" "$OUT/assets/www/lib/"

echo "› recursos"
"$BT/aapt2.exe" compile --dir "$AQUI/res" -o "$OUT/res.zip"
"$BT/aapt2.exe" link -o "$OUT/base.apk" -I "$JAR" --manifest "$AQUI/AndroidManifest.xml" \
  "$OUT/res.zip" --java "$OUT/gen" \
  --min-sdk-version 24 --target-sdk-version 34 --version-code "$VERSION_CODE" --version-name "$VERSION_NAME"

echo "› java"
javac -encoding UTF-8 -source 11 -target 11 -Xlint:-options -classpath "$JAR" -d "$OUT/classes" \
  $(find "$AQUI/src" "$OUT/gen" -name '*.java')
"$BT/d8.bat" --release --min-api 24 --lib "$JAR" --output "$OUT" $(find "$OUT/classes" -name '*.class')

echo "› empaquetar"
# Los assets se agregan con jar y no con "aapt2 -A": en Windows aapt2 los guarda como "assets/www\index.html"
# (barra invertida) y en Android la app no los encuentra.
(cd "$OUT" && jar -uf0M base.apk classes.dex assets)
if unzip -Z1 "$OUT/base.apk" | grep -qF '\'; then echo "✗ hay rutas con barra invertida en el APK"; exit 1; fi
"$BT/zipalign.exe" -p -f 4 "$OUT/base.apk" "$OUT/alineado.apk"

# Firma con una clave propia (se crea una sola vez; guardala: sin ella no se puede actualizar la app instalada)
KS=$AQUI/autocontrol.keystore
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -storepass autocontrol -keypass autocontrol -alias autocontrol \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=AutoControl" >/dev/null 2>&1
fi
"$BT/apksigner.bat" sign --ks "$KS" --ks-pass pass:autocontrol --key-pass pass:autocontrol --out "$RAIZ/AutoControl.apk" "$OUT/alineado.apk"
"$BT/apksigner.bat" verify "$RAIZ/AutoControl.apk"
echo "✓ $RAIZ/AutoControl.apk ($(du -h "$RAIZ/AutoControl.apk" | cut -f1))"
