package com.fightarenax.game;
import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.*;
import android.view.View;
public class MainActivity extends Activity {
 private WebView web; private ValueCallback<Uri[]> fileCallback; private static final int PICK=22;
 @Override public void onCreate(Bundle b){ super.onCreate(b); getWindow().getDecorView().setSystemUiVisibility(5894|1024|512); web=new WebView(this); setContentView(web); WebSettings s=web.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setAllowFileAccess(true); web.setWebChromeClient(new WebChromeClient(){ @Override public boolean onShowFileChooser(WebView w,ValueCallback<Uri[]> cb,FileChooserParams p){ fileCallback=cb; Intent i=new Intent(Intent.ACTION_GET_CONTENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("*/*");startActivityForResult(Intent.createChooser(i,"Select character image or sound"),PICK);return true; }}); web.loadUrl("file:///android_asset/index.html"); }
 @Override protected void onActivityResult(int req,int result,Intent data){super.onActivityResult(req,result,data);if(req==PICK&&fileCallback!=null){fileCallback.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);fileCallback=null;}}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
}
