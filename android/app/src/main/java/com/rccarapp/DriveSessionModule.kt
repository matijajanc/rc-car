package com.rccarapp

import android.content.Context
import android.net.wifi.WifiManager
import android.os.Build
import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/**
 * Drive-session locks. Held only while the driving dashboard is up
 * (src/utils/drive-state.ts calls acquire/release via src/utils/drive-locks.ts):
 *
 *  - A Wi-Fi lock so the radio never enters power-save mid-session. Field logs
 *    showed the radio dozing during driving pauses, blacking out the link for
 *    1-1.5s+ both ways; WIFI_MODE_FULL_LOW_LATENCY (Android 10+) is built for
 *    exactly this real-time-control case (falls back to FULL_HIGH_PERF on
 *    older versions). Requires ACCESS_WIFI_STATE + WAKE_LOCK (manifest).
 *  - FLAG_KEEP_SCREEN_ON, because a screen timeout backgrounds the app, and a
 *    backgrounded app deliberately stops the car.
 *
 * This is a comfort/latency optimisation, never a safety dependency: the car's
 * own motion lease (arduino/rc-car/rc-car.ino) is what guarantees it stops.
 */
class DriveSessionModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var wifiLock: WifiManager.WifiLock? = null

  override fun getName(): String = "DriveSession"

  @ReactMethod
  fun acquire() {
    if (wifiLock == null) {
      val wifi = reactApplicationContext.applicationContext
        .getSystemService(Context.WIFI_SERVICE) as WifiManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        WifiManager.WIFI_MODE_FULL_LOW_LATENCY
      } else {
        @Suppress("DEPRECATION")
        WifiManager.WIFI_MODE_FULL_HIGH_PERF
      }
      wifiLock = wifi.createWifiLock(mode, "rc-car:drive-session").apply {
        setReferenceCounted(false)
      }
    }
    wifiLock?.takeIf { !it.isHeld }?.acquire()
    val activity = reactApplicationContext.currentActivity
    if (activity != null) {
      UiThreadUtil.runOnUiThread {
        activity.window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
  }

  @ReactMethod
  fun release() {
    wifiLock?.takeIf { it.isHeld }?.release()
    val activity = reactApplicationContext.currentActivity
    if (activity != null) {
      UiThreadUtil.runOnUiThread {
        activity.window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
  }

  // React instance teardown (reload, app exit): never leak the Wi-Fi lock.
  override fun invalidate() {
    wifiLock?.takeIf { it.isHeld }?.release()
    wifiLock = null
    super.invalidate()
  }
}
