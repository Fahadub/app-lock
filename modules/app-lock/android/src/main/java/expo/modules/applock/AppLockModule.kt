package expo.modules.applock

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class AppLockModule : Module() {

  private val ctx: Context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {

    Name("AppLock")

    AsyncFunction("getInstalledApps") { installedApps() }

    AsyncFunction("saveCredential") { method: String, salt: String, hash: String, pinLength: Int ->
      val e = Prefs.get(ctx).edit()
      if (method == "pin") {
        e.putString(Prefs.KEY_METHOD, "pin")
        e.putString(Prefs.KEY_SALT, salt)
        e.putString(Prefs.KEY_PIN_HASH, hash)
        e.putInt(Prefs.KEY_PIN_LENGTH, if (pinLength in 4..8) pinLength else 4)
        e.remove(Prefs.KEY_PATTERN_HASH)
      } else {
        e.putString(Prefs.KEY_METHOD, "pattern")
        e.putString(Prefs.KEY_SALT, salt)
        e.putString(Prefs.KEY_PATTERN_HASH, hash)
        e.remove(Prefs.KEY_PIN_HASH)
      }
      e.apply()
    }

    AsyncFunction("getSettings") {
      val p = Prefs.get(ctx)
      mapOf(
        "method" to Prefs.method(ctx),
        "hasCredential" to Prefs.hasCredential(ctx),
        "lockedApps" to Prefs.lockedSet(ctx).toList(),
        "protectionEnabled" to p.getBoolean(Prefs.KEY_ENABLED, false),
        "serviceRunning" to AppLockService.isRunning(),
        "salt" to Prefs.salt(ctx),
        "hash" to Prefs.hashFor(ctx),
        "pinLength" to p.getInt(Prefs.KEY_PIN_LENGTH, 4)
      )
    }

    AsyncFunction("setLockedApps") { packages: List<String> ->
      AppLockService.updateLocked(ctx, packages)
    }

    AsyncFunction("setProtectionEnabled") { enabled: Boolean ->
      Prefs.get(ctx).edit().putBoolean(Prefs.KEY_ENABLED, enabled).apply()
      if (enabled && Prefs.hasCredential(ctx)) {
        AppLockService.start(ctx)
      } else {
        AppLockService.stop(ctx)
      }
    }

    Function("hasUsageAccess") { hasUsageAccess() }

    AsyncFunction("openUsageAccessSettings") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      runCatching { ctx.startActivity(intent) }
    }

    Function("canDrawOverlays") { Settings.canDrawOverlays(ctx) }

    AsyncFunction("openOverlaySettings") {
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:${ctx.packageName}")
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      runCatching { ctx.startActivity(intent) }
    }

    Function("isIgnoringBatteryOptimizations") {
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(ctx.packageName)
    }

    AsyncFunction("requestIgnoreBatteryOptimizations") {
      try {
        val intent = Intent(
          Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          Uri.parse("package:${ctx.packageName}")
        )
        val activity = appContext.currentActivity
        if (activity != null) {
          activity.startActivity(intent)
        } else {
          intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          ctx.startActivity(intent)
        }
        true
      } catch (e: Exception) {
        false
      }
    }

    AsyncFunction("openBatterySettings") {
      val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      runCatching { ctx.startActivity(intent) }
    }

    Function("isServiceRunning") { AppLockService.isRunning() }

    AsyncFunction("getLanguage") {
      Prefs.get(ctx).getString(Prefs.KEY_LANGUAGE, "ar") ?: "ar"
    }

    AsyncFunction("saveLanguage") { lang: String ->
      val value = if (lang == "en") "en" else "ar"
      Prefs.get(ctx).edit().putString(Prefs.KEY_LANGUAGE, value).apply()
    }
  }

  @Suppress("DEPRECATION")
  private fun hasUsageAccess(): Boolean = try {
    val appOps = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = appOps.checkOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      android.os.Process.myUid(),
      ctx.packageName
    )
    mode == AppOpsManager.MODE_ALLOWED
  } catch (e: Exception) {
    false
  }

  private fun installedApps(): List<Map<String, String?>> {
    val pm = ctx.packageManager
    return pm.getInstalledApplications(0)
      .filter { app -> pm.getLaunchIntentForPackage(app.packageName) != null && app.packageName != ctx.packageName }
      .map { app ->
        mapOf(
          "packageName" to app.packageName,
          "appName" to runCatching { app.loadLabel(pm).toString() }.getOrDefault(app.packageName),
          "icon" to runCatching { iconBase64(app.loadIcon(pm)) }.getOrNull()
        )
      }
      .sortedBy { (it["appName"] as String).lowercase() }
  }

  private fun iconBase64(drawable: Drawable): String {
    val srcW = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
    val srcH = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
    val scale = 96f / maxOf(srcW, srcH).coerceAtLeast(1)
    val w = (srcW * scale).toInt().coerceAtLeast(1)
    val h = (srcH * scale).toInt().coerceAtLeast(1)
    val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, w, h)
    drawable.draw(canvas)
    val out = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
    bitmap.recycle()
    return Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  }
}
