package expo.modules.applock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper

/**
 * Foreground service that watches which app is in the foreground (via
 * UsageStatsManager) and throws LockActivity on top of any locked app.
 */
class AppLockService : Service() {

  private val handler = Handler(Looper.getMainLooper())
  private val locked = mutableSetOf<String>()
  private val unlocked = mutableSetOf<String>()

  /** Packages that must never trigger the lock / re-lock logic. */
  private val ignored = setOf("com.android.systemui")

  private var lastForeground: String? = null
  private var lastShownFor: String? = null
  private var lastShownAt = 0L

  private val poller = object : Runnable {
    override fun run() {
      try {
        checkForeground()
      } catch (_: Exception) {
      }
      handler.postDelayed(this, POLL_INTERVAL)
    }
  }

  private val screenOffReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      synchronized(unlocked) { unlocked.clear() }
    }
  }

  override fun onCreate() {
    super.onCreate()
    instance = this
    createChannel()
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
    registerReceiver(screenOffReceiver, IntentFilter(Intent.ACTION_SCREEN_OFF))
    refreshLocked()
    handler.post(poller)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    refreshLocked()
    return START_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    runCatching { unregisterReceiver(screenOffReceiver) }
    instance = null
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  fun refreshLocked() {
    val next = Prefs.lockedSet(this).toMutableSet()
    next.remove(packageName)
    synchronized(locked) {
      locked.clear()
      locked.addAll(next)
    }
  }

  private fun checkForeground() {
    val fg = foregroundPackage() ?: return
    if (fg in ignored) return

    if (fg != lastForeground) {
      val prev = lastForeground
      lastForeground = fg
      if (prev != null) {
        synchronized(unlocked) { unlocked.remove(prev) }
      }
    }

    val lockedNow = synchronized(locked) { locked.toSet() }
    if (fg !in lockedNow) return
    synchronized(unlocked) {
      if (fg in unlocked) return
    }
    if (LockActivity.isShowing) return

    val now = System.currentTimeMillis()
    if (lastShownFor == fg && now - lastShownAt < RELOCK_THROTTLE) return
    lastShownFor = fg
    lastShownAt = now
    showLock(fg)
  }

  private fun foregroundPackage(): String? {
    return try {
      val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val now = System.currentTimeMillis()
      val events = usm.queryEvents(now - EVENT_WINDOW, now)
      val event = UsageEvents.Event()
      var pkg: String? = null
      while (events.hasNextEvent()) {
        events.getNextEvent(event)
        if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
          pkg = event.packageName
        }
      }
      pkg
    } catch (_: Exception) {
      null
    }
  }

  private fun showLock(pkg: String) {
    val intent = Intent(this, LockActivity::class.java)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS)
      .putExtra(LockActivity.EXTRA_PKG, pkg)
    runCatching { startActivity(intent) }
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT >= 26) {
      val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
      val channel = NotificationChannel(CHANNEL_ID, "حماية التطبيقات", NotificationManager.IMPORTANCE_MIN)
      channel.description = "يُستخدم لتشغيل خدمة القفل في الخلفية"
      channel.setShowBadge(false)
      manager.createNotificationChannel(channel)
    }
  }

  @Suppress("DEPRECATION")
  private fun buildNotification(): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val contentIntent = launchIntent?.let {
      PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }
    val builder = if (Build.VERSION.SDK_INT >= 26) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      Notification.Builder(this)
    }
    return builder
      .setContentTitle("قفل التطبيقات")
      .setContentText("الحماية تعمل في الخلفية")
      .setSmallIcon(android.R.drawable.ic_lock_lock)
      .setOngoing(true)
      .setContentIntent(contentIntent)
      .build()
  }

  companion object {
    const val CHANNEL_ID = "applock_protection"
    const val NOTIFICATION_ID = 4201
    private const val POLL_INTERVAL = 700L
    private const val EVENT_WINDOW = 15000L
    private const val RELOCK_THROTTLE = 2500L

    @Volatile
    var instance: AppLockService? = null
      private set

    fun isRunning(): Boolean = instance != null

    fun start(context: Context) {
      val intent = Intent(context, AppLockService::class.java)
      if (Build.VERSION.SDK_INT >= 26) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, AppLockService::class.java))
    }

    fun updateLocked(context: Context, packages: Collection<String>) {
      Prefs.putLocked(context, packages)
      instance?.let { svc ->
        svc.handler.post { svc.refreshLocked() }
      }
    }

    fun unlock(pkg: String) {
      instance?.let { svc ->
        svc.handler.post {
          synchronized(svc.unlocked) { svc.unlocked.add(pkg) }
        }
      }
    }
  }
}
