package ar.autocontrol;

import android.Manifest;
import android.app.Activity;
import android.app.PictureInPictureParams;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Rational;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Locale;

/**
 * Envuelve AutoControl.html (en assets/www) en un WebView.
 * Las paginas se sirven desde https://appassets.androidplatform.net para que el navegador
 * las trate como sitio seguro: asi funcionan el GPS y el localStorage igual que en la web.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final int PEDIR_UBICACION = 1, ELEGIR_ARCHIVO = 2, GUARDAR_ARCHIVO = 3;

    private WebView web;
    private GeolocationPermissions.Callback geoCallback;
    private String geoOrigen;
    private ValueCallback<Uri[]> archivoCallback;
    private byte[] contenidoAGuardar;
    private Uri fotoCamara;
    private TextToSpeech voz;
    private boolean vozLista;
    private boolean mapaAbierto;   // con el mapa abierto, salir de la app la achica a una ventanita

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        getWindow().setStatusBarColor(Color.parseColor("#4A3AA7"));
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setGeolocationEnabled(true);
        s.setAllowFileAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUseWideViewPort(true);   // respeta el <meta viewport> igual que Chrome (escala 1 fija)

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String ruta = u.getPath();
                if (ruta == null || ruta.equals("/")) ruta = "/index.html";
                try {
                    InputStream in = getAssets().open("www" + ruta);
                    return new WebResourceResponse(tipo(ruta), "utf-8", in);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "No encontrado", null, null);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origen, GeolocationPermissions.Callback cb) {
                if (tienePermisoUbicacion()) { cb.invoke(origen, true, false); return; }
                geoCallback = cb;
                geoOrigen = origen;
                requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, PEDIR_UBICACION);
            }

            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (archivoCallback != null) archivoCallback.onReceiveValue(null);
                archivoCallback = cb;
                fotoCamara = null;
                boolean fotos = false;
                for (String t : params.getAcceptTypes()) if (t.contains("image")) fotos = true;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                Intent elegir;
                if (fotos) {
                    // Papeles: galeria / archivos (fotos y PDF) o sacar una foto con la camara.
                    i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/*", "application/pdf"});
                    i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                    elegir = Intent.createChooser(i, "Agregar foto o PDF");
                    File f = new File(new File(getCacheDir(), "camara"), "foto-" + System.currentTimeMillis() + ".jpg");
                    f.getParentFile().mkdirs();
                    fotoCamara = Archivos.uri(f);
                    Intent cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    cam.putExtra(MediaStore.EXTRA_OUTPUT, fotoCamara);
                    cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    cam.setClipData(ClipData.newRawUri("foto", fotoCamara));
                    elegir.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
                } else {
                    elegir = Intent.createChooser(i, "Elegí el backup");
                }
                try { startActivityForResult(elegir, ELEGIR_ARCHIVO); }
                catch (Exception e) { archivoCallback = null; return false; }
                return true;
            }
        });

        web.addJavascriptInterface(new Puente(), "Android");

        if (estado != null) web.restoreState(estado);
        else web.loadUrl("https://" + HOST + "/index.html");
    }

    private boolean tienePermisoUbicacion() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private static String tipo(String ruta) {
        String r = ruta.toLowerCase(Locale.ROOT);
        if (r.endsWith(".html")) return "text/html";
        if (r.endsWith(".js")) return "text/javascript";
        if (r.endsWith(".css")) return "text/css";
        if (r.endsWith(".png")) return "image/png";
        if (r.endsWith(".svg")) return "image/svg+xml";
        if (r.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    @Override
    public void onRequestPermissionsResult(int codigo, String[] permisos, int[] resultados) {
        if (codigo == PEDIR_UBICACION && geoCallback != null) {
            geoCallback.invoke(geoOrigen, tienePermisoUbicacion(), false);
            geoCallback = null;
        }
    }

    @Override
    protected void onActivityResult(int codigo, int resultado, Intent datos) {
        if (codigo == ELEGIR_ARCHIVO && archivoCallback != null) {
            ArrayList<Uri> lista = new ArrayList<>();
            if (resultado == RESULT_OK) {
                if (datos != null && datos.getClipData() != null && datos.getData() == null) {
                    ClipData c = datos.getClipData();
                    for (int k = 0; k < c.getItemCount(); k++) lista.add(c.getItemAt(k).getUri());
                } else if (datos != null && datos.getData() != null) {
                    lista.add(datos.getData());
                } else if (fotoCamara != null) {
                    lista.add(fotoCamara);   // la camara no devuelve datos: la foto quedo en fotoCamara
                }
            }
            archivoCallback.onReceiveValue(lista.isEmpty() ? null : lista.toArray(new Uri[0]));
            archivoCallback = null;
            fotoCamara = null;
        } else if (codigo == GUARDAR_ARCHIVO) {
            Uri u = resultado == RESULT_OK && datos != null ? datos.getData() : null;
            if (u != null && contenidoAGuardar != null) {
                try (OutputStream out = getContentResolver().openOutputStream(u)) {
                    out.write(contenidoAGuardar);
                    Toast.makeText(this, "Archivo guardado", Toast.LENGTH_SHORT).show();
                } catch (Exception e) {
                    Toast.makeText(this, "No se pudo guardar el archivo", Toast.LENGTH_LONG).show();
                }
            }
            contenidoAGuardar = null;
        }
    }

    /** Ventanita flotante (imagen en imagen) con el mapa: Android 8 o mas nuevo. */
    private PictureInPictureParams parametrosPip() {
        PictureInPictureParams.Builder b = new PictureInPictureParams.Builder().setAspectRatio(new Rational(3, 4));
        if (Build.VERSION.SDK_INT >= 31) b.setAutoEnterEnabled(mapaAbierto).setSeamlessResizeEnabled(false);
        return b.build();
    }

    private boolean entrarPip() {
        if (Build.VERSION.SDK_INT < 26 || isInPictureInPictureMode()) return false;
        try { return enterPictureInPictureMode(parametrosPip()); } catch (Exception e) { return false; }
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        // En Android 12+ entra solo (setAutoEnterEnabled); antes hay que pedirlo al apretar Inicio.
        if (mapaAbierto && Build.VERSION.SDK_INT >= 26 && Build.VERSION.SDK_INT < 31) entrarPip();
    }

    @Override
    public void onPictureInPictureModeChanged(boolean pip, Configuration conf) {
        super.onPictureInPictureModeChanged(pip, conf);
        web.evaluateJavascript("window.modoPip && modoPip(" + pip + ")", null);
        // Al achicarse, el WebView cambia su zoom para que entre la pagina y al volver lo deja asi
        // (todo se ve grande). Se lo vuelve a la escala normal cuando ya tomo el tamano completo.
        if (!pip) { web.postDelayed(this::zoomNormal, 300); web.postDelayed(this::zoomNormal, 900); }
    }

    private void zoomNormal() {
        for (int k = 0; k < 30 && web.zoomOut(); k++) { }
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle estado) {
        super.onSaveInstanceState(estado);
        web.saveState(estado);
    }

    @Override
    protected void onDestroy() {
        if (voz != null) voz.shutdown();
        web.destroy();
        super.onDestroy();
    }

    private void pedirDondeGuardar(final String nombre, final String tipo, final byte[] datos) {
        runOnUiThread(() -> {
            contenidoAGuardar = datos;
            Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType(tipo);
            i.putExtra(Intent.EXTRA_TITLE, nombre);
            startActivityForResult(i, GUARDAR_ARCHIVO);
        });
    }

    /** Funciones que la pagina llama como window.Android.* */
    private class Puente {
        @JavascriptInterface
        public void mapaAbierto(final boolean abierto) {
            runOnUiThread(() -> {
                mapaAbierto = abierto;
                if (Build.VERSION.SDK_INT >= 26) try { setPictureInPictureParams(parametrosPip()); } catch (Exception e) { }
            });
        }

        @JavascriptInterface
        public void minimizar() {
            runOnUiThread(() -> {
                if (!entrarPip()) moveTaskToBack(true);
            });
        }

        @JavascriptInterface
        public void pantalla(final boolean encendida) {
            runOnUiThread(() -> {
                if (encendida) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface
        public void hablar(final String texto) {
            runOnUiThread(() -> {
                if (voz == null) {
                    voz = new TextToSpeech(MainActivity.this, st -> {
                        vozLista = st == TextToSpeech.SUCCESS;
                        if (vozLista) {
                            voz.setLanguage(new Locale("es", "AR"));
                            voz.speak(texto, TextToSpeech.QUEUE_FLUSH, null, "nav");
                        }
                    });
                } else if (vozLista) {
                    voz.speak(texto, TextToSpeech.QUEUE_FLUSH, null, "nav");
                }
            });
        }

        @JavascriptInterface
        public void guardarArchivo(final String nombre, final String contenido) {
            pedirDondeGuardar(nombre, "application/json", contenido.getBytes(StandardCharsets.UTF_8));
        }

        @JavascriptInterface
        public void guardarArchivoB64(final String nombre, final String tipo, final String base64) {
            pedirDondeGuardar(nombre, tipo, Base64.decode(base64, Base64.DEFAULT));
        }

        /** Abre un adjunto (PDF o foto) con la app del telefono que sepa mostrarlo. */
        @JavascriptInterface
        public void abrirArchivo(final String nombre, final String tipo, final String base64) {
            try {
                File f = new File(new File(getCacheDir(), "compartidos"), nombre.replaceAll("[^\\w.\\- ]", "_"));
                f.getParentFile().mkdirs();
                try (FileOutputStream out = new FileOutputStream(f)) { out.write(Base64.decode(base64, Base64.DEFAULT)); }
                final Intent i = new Intent(Intent.ACTION_VIEW);
                i.setDataAndType(Archivos.uri(f), tipo);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                runOnUiThread(() -> {
                    try { startActivity(Intent.createChooser(i, "Abrir con")); }
                    catch (Exception e) { Toast.makeText(MainActivity.this, "No hay ninguna app para abrir este archivo", Toast.LENGTH_LONG).show(); }
                });
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "No se pudo abrir el archivo", Toast.LENGTH_LONG).show());
            }
        }
    }
}
