package com.fightarenax.game;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.*;
import android.view.View;
import android.os.Handler;
import android.os.Looper;
import android.annotation.SuppressLint;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private static final int PICK = 22;
    private static final String STATUS_URL =
        "https://raw.githubusercontent.com/zarinhasan26-oss/Fight-Arena-X--/main/online-status.json";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private volatile boolean destroyed = false;
    private volatile boolean lastOnline = false;
    private final Runnable checkOnline = new Runnable() {
        @Override public void run() {
            new Thread(() -> {
                boolean online = verifyOnline();
                lastOnline = online;
                runOnUiThread(() -> {
                    if (destroyed || web == null) return;
                    web.evaluateJavascript("window.setVerifiedOnline && window.setVerifiedOnline(" + online + ");", null);
                    if (!destroyed) handler.postDelayed(checkOnline, 8000);
                });
            }, "OnlineStatusCheck").start();
        }
    };

    private boolean verifyOnline() {
        HttpURLConnection connection = null;
        try {
            URL url = new URL(STATUS_URL + "?t=" + System.currentTimeMillis());
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            connection.setUseCaches(false);
            connection.setRequestProperty("Cache-Control", "no-cache, no-store, max-age=0");
            connection.setRequestProperty("Pragma", "no-cache");
            connection.setRequestProperty("Accept", "application/json");
            if (connection.getResponseCode() != 200) return false;
            try (InputStream stream = connection.getInputStream()) {
                byte[] buffer = new byte[4096];
                int len = stream.read(buffer);
                if (len <= 0) return false;
                JSONObject status = new JSONObject(new String(buffer, 0, len, StandardCharsets.UTF_8));
                return status.optBoolean("online_enabled", false);
            }
        } catch (Exception e) {
            return false;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    public final class OnlineBridge {
        @JavascriptInterface public boolean isOnlineVerified() { return lastOnline; }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().getDecorView().setSystemUiVisibility(5894|1024|512);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        web.addJavascriptInterface(new OnlineBridge(), "FightNetwork");
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (!lastOnline) { cb.onReceiveValue(null); return true; }
                fileCallback = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                startActivityForResult(Intent.createChooser(i, "Select character image or sound"), PICK);
                return true;
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                web.evaluateJavascript("window.setVerifiedOnline && window.setVerifiedOnline(" + lastOnline + ");", null);
            }
        });
        web.loadUrl("file:///android_asset/index.html");
        handler.post(checkOnline);
    }

    @Override protected void onResume() {
        super.onResume();
        handler.removeCallbacks(checkOnline);
        handler.post(checkOnline);
    }

    @Override protected void onPause() {
        handler.removeCallbacks(checkOnline);
        lastOnline = false;
        if (web != null) web.evaluateJavascript("window.setVerifiedOnline && window.setVerifiedOnline(false);", null);
        super.onPause();
    }

    @Override protected void onDestroy() {
        destroyed = true;
        handler.removeCallbacks(checkOnline);
        if (web != null) web.destroy();
        super.onDestroy();
    }

    @Override protected void onActivityResult(int req, int result, Intent data) {
        super.onActivityResult(req, result, data);
        if (req == PICK && fileCallback != null) {
            fileCallback.onReceiveValue(
                result == RESULT_OK && data != null && data.getData() != null
                    ? new Uri[]{data.getData()} : null);
            fileCallback = null;
        }
    }

    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
