package expo.modules.applock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Restarts the protection service after the phone reboots. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
    val enabled = Prefs.get(context).getBoolean(Prefs.KEY_ENABLED, false)
    if (enabled && Prefs.hasCredential(context)) {
      runCatching { AppLockService.start(context) }
    }
  }
}
