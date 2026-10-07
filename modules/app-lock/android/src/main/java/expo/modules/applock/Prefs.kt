package expo.modules.applock

import android.content.Context
import android.content.SharedPreferences

object Prefs {
  private const val FILE = "applock_prefs"

  const val KEY_METHOD = "method"
  const val KEY_SALT = "salt"
  const val KEY_PIN_HASH = "pin_hash"
  const val KEY_PATTERN_HASH = "pattern_hash"
  const val KEY_PIN_LENGTH = "pin_length"
  const val KEY_LOCKED = "locked_apps"
  const val KEY_ENABLED = "protection_enabled"
  const val KEY_LANGUAGE = "language"

  fun get(ctx: Context): SharedPreferences = ctx.getSharedPreferences(FILE, Context.MODE_PRIVATE)

  fun lockedSet(ctx: Context): Set<String> =
    get(ctx).getStringSet(KEY_LOCKED, emptySet())?.toSet() ?: emptySet()

  fun putLocked(ctx: Context, pkgs: Collection<String>) {
    get(ctx).edit().putStringSet(KEY_LOCKED, pkgs.toSet()).apply()
  }

  fun method(ctx: Context): String? = get(ctx).getString(KEY_METHOD, null)

  fun hasCredential(ctx: Context): Boolean {
    return when (method(ctx)) {
      "pin" -> get(ctx).getString(KEY_PIN_HASH, null) != null
      "pattern" -> get(ctx).getString(KEY_PATTERN_HASH, null) != null
      else -> false
    }
  }

  fun salt(ctx: Context): String = get(ctx).getString(KEY_SALT, "") ?: ""

  fun language(ctx: Context): String = get(ctx).getString(KEY_LANGUAGE, "ar") ?: "ar"

  fun hashFor(ctx: Context): String? {
    return if (method(ctx) == "pin") {
      get(ctx).getString(KEY_PIN_HASH, null)
    } else {
      get(ctx).getString(KEY_PATTERN_HASH, null)
    }
  }
}
