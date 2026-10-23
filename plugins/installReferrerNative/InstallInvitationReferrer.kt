package com.yht.dominoparty.installreferrer

import android.os.Handler
import android.os.Looper
import android.util.AtomicFile
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import com.facebook.react.bridge.*
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.Executors

/** One installation, one cached locator. Neither pending data nor consumed tombstones enter backup. */
class InstallInvitationReferrer(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
 private val lock = Any()
 private val file = AtomicFile(File(context.noBackupFilesDir, "invitation-install-v1.json"))
 private val install = context.packageManager.getPackageInfo(context.packageName, 0).firstInstallTime.toString()
 private val handler = Handler(Looper.getMainLooper())
 private val reader = Executors.newSingleThreadExecutor { task -> Thread(task,"InvitationReferrerRead").apply { isDaemon=true } }
 private var client: InstallReferrerClient? = null
 private var pending: Promise? = null
 private var timeout: Runnable? = null
 @Volatile private var invalidated = false
 override fun getName() = "InstallInvitationReferrer"
 private fun state(): JSONObject? = try { JSONObject(String(file.readFully(), Charsets.UTF_8)).takeIf { it.optString("install") == install } } catch (_: Exception) { null }
 private fun write(value: JSONObject) {
  value.put("install", install)
  val stream = file.startWrite()
  try { stream.write(value.toString().toByteArray(Charsets.UTF_8)); file.finishWrite(stream) } catch (e: Exception) { file.failWrite(stream); throw e }
 }
 private fun result(value: JSONObject): WritableMap = Arguments.createMap().apply {
  putString("status", value.getString("status"))
  if (value.optString("status") == "pending") {
   putString("key",value.getString("key")); putString("raw",value.getString("raw"))
   putDouble("clickMs",value.getDouble("clickMs")); putDouble("installMs",value.getDouble("installMs"))
  }
 }
 @ReactMethod fun ignore(promise: Promise) = synchronized(lock) {
  try { write(JSONObject().put("status","consumed")); promise.resolve(null) } catch (e: Exception) { promise.reject("storage_error",e) }
 }
 @ReactMethod fun consume(key: String, promise: Promise) = synchronized(lock) {
  try { val s=state(); if(s?.optString("status")=="pending" && s.optString("key")==key) write(JSONObject().put("status","consumed")); promise.resolve(null) } catch (e: Exception) { promise.reject("storage_error",e) }
 }
 @ReactMethod fun read(promise: Promise) {
  synchronized(lock) {
   if(invalidated){promise.reject("referrer_unavailable","Module closed");return}
   try { val cached=state(); if(cached!=null){promise.resolve(result(cached));return} } catch(e: Exception){promise.reject("storage_error",e);return}
   if(pending!=null){promise.reject("referrer_busy","Try again");return}
   pending=promise
  }
  val finished=AtomicBoolean(false)
  fun finish(value: JSONObject?, error: Exception?) {
   if(!finished.compareAndSet(false,true))return
   synchronized(lock) {
    timeout?.let { handler.removeCallbacks(it) }; timeout=null
    try { client?.endConnection() } catch (_: Exception) {} ; client=null
    val target=pending;pending=null
    if(invalidated)return
    try {
     // A normal URL may have ignored the referrer while Play was responding.
     val cached=state()
     if(cached!=null)target?.resolve(result(cached))
     else if(error!=null)target?.reject("referrer_unavailable",error)
     else if(value!=null){write(value);target?.resolve(result(value))}
     else target?.reject("referrer_unavailable","Try again")
    } catch(e: Exception){target?.reject("storage_error",e)}
   }
  }
  handler.post {
   if(invalidated)return@post
   try {
    val connection=InstallReferrerClient.newBuilder(context).build();client=connection
    timeout=Runnable { finish(null,Exception("timeout")) };handler.postDelayed(timeout!!,10000)
    connection.startConnection(object: InstallReferrerStateListener {
     override fun onInstallReferrerSetupFinished(code: Int) {
      if(finished.get())return
      try {
       when(code) {
        InstallReferrerClient.InstallReferrerResponse.OK -> {
         // Binder reads can block; keep both the UI and its timeout handler free.
         reader.execute { try {
         if(finished.get()||invalidated)return@execute
         val r=connection.installReferrer
         val click=if(r.referrerClickTimestampServerSeconds>0)r.referrerClickTimestampServerSeconds else r.referrerClickTimestampSeconds
         val installed=if(r.installBeginTimestampServerSeconds>0)r.installBeginTimestampServerSeconds else r.installBeginTimestampSeconds
         val raw=r.installReferrer
         if(raw.length>1024){finish(JSONObject().put("status","consumed"),null);return@execute}
         val digest=MessageDigest.getInstance("SHA-256").digest((install+"\n"+raw+"\n"+installed).toByteArray()).joinToString(""){"%02x".format(it)}
         finish(JSONObject().put("status","pending").put("key",digest).put("raw",raw).put("clickMs",click*1000).put("installMs",installed*1000),null)
         } catch(e: Exception){finish(null,e)} }
        }
        InstallReferrerClient.InstallReferrerResponse.FEATURE_NOT_SUPPORTED -> finish(JSONObject().put("status","consumed"),null)
        else -> finish(null,Exception("Play unavailable"))
       }
      } catch(e: Exception){finish(null,e)}
     }
     override fun onInstallReferrerServiceDisconnected(){finish(null,Exception("disconnected"))}
    })
   } catch(e: Exception){finish(null,e)}
  }
 }
 override fun invalidate() {
  synchronized(lock){invalidated=true;timeout?.let{handler.removeCallbacks(it)};timeout=null;try{client?.endConnection()}catch(_:Exception){};client=null;pending?.reject("referrer_unavailable","Module closed");pending=null;reader.shutdownNow()}
  super.invalidate()
 }
}
