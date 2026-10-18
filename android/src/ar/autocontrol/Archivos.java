package ar.autocontrol;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Locale;

/**
 * Comparte archivos de la cache de la app con otras apps (visor de PDF, camara)
 * sin depender de androidx: content://ar.autocontrol.archivos/<carpeta>/<archivo>
 */
public class Archivos extends ContentProvider {
    public static final String AUTORIDAD = "ar.autocontrol.archivos";

    public static Uri uri(File f) {
        return Uri.parse("content://" + AUTORIDAD + "/" + f.getParentFile().getName() + "/" + Uri.encode(f.getName()));
    }

    private File archivo(Uri u) throws FileNotFoundException {
        File base = getContext().getCacheDir();
        File f = new File(base, u.getPath());
        try {
            if (!f.getCanonicalPath().startsWith(base.getCanonicalPath() + File.separator)) throw new FileNotFoundException();
        } catch (IOException e) {
            throw new FileNotFoundException();
        }
        return f;
    }

    @Override
    public boolean onCreate() { return true; }

    @Override
    public ParcelFileDescriptor openFile(Uri u, String modo) throws FileNotFoundException {
        File f = archivo(u);
        if (modo.contains("w")) f.getParentFile().mkdirs();
        return ParcelFileDescriptor.open(f, ParcelFileDescriptor.parseMode(modo));
    }

    @Override
    public Cursor query(Uri u, String[] cols, String sel, String[] args, String orden) {
        MatrixCursor c = new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
        try {
            File f = archivo(u);
            c.addRow(new Object[]{f.getName(), f.length()});
        } catch (FileNotFoundException e) { }
        return c;
    }

    @Override
    public String getType(Uri u) {
        String n = u.getPath() == null ? "" : u.getPath().toLowerCase(Locale.ROOT);
        if (n.endsWith(".pdf")) return "application/pdf";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    @Override public Uri insert(Uri u, ContentValues v) { return null; }
    @Override public int delete(Uri u, String s, String[] a) { return 0; }
    @Override public int update(Uri u, ContentValues v, String s, String[] a) { return 0; }
}
