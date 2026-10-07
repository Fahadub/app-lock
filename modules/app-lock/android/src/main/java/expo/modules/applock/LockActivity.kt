package expo.modules.applock

import android.animation.ObjectAnimator
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.CountDownTimer
import android.view.Gravity
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import java.security.MessageDigest
import java.util.Locale

/**
 * Native lock screen shown on top of a locked app. Supports PIN and pattern.
 * Runs in its own task so finishing it reveals the previously opened app.
 */
class LockActivity : Activity() {

  private val density: Float get() = resources.displayMetrics.density
  private fun dip(v: Int): Int = (v * density).toInt()

  private lateinit var feedback: TextView
  private lateinit var cooldownText: TextView
  private var dotsRow: LinearLayout? = null
  private var patternView: PatternView? = null
  private var entry = StringBuilder()

  private var pkg = ""
  private var salt = ""
  private var expectedHash: String? = null
  private var pinLength = 4
  private var wrong = 0
  private var lockoutUntil = 0L
  private var timer: CountDownTimer? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    isShowing = true

    pkg = intent.getStringExtra(EXTRA_PKG) ?: ""
    expectedHash = Prefs.hashFor(this)
    salt = Prefs.salt(this)
    if (pkg.isBlank() || expectedHash == null) {
      finish()
      return
    }
    val method = Prefs.method(this) ?: "pin"
    pinLength = Prefs.get(this).getInt(Prefs.KEY_PIN_LENGTH, 4)

    @Suppress("DEPRECATION")
    window.statusBarColor = Color.parseColor(BG)
    @Suppress("DEPRECATION")
    window.navigationBarColor = Color.parseColor(BG)

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(Color.parseColor(BG))
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(dip(24), dip(64), dip(24), dip(40))
    }

    runCatching {
      val info = packageManager.getApplicationInfo(pkg, 0)
      val icon = ImageView(this).apply {
        setImageDrawable(info.loadIcon(packageManager))
        layoutParams = LinearLayout.LayoutParams(dip(64), dip(64)).apply {
          gravity = Gravity.CENTER_HORIZONTAL
        }
      }
      root.addView(icon)
      root.addView(
        TextView(this).apply {
          text = info.loadLabel(packageManager).toString()
          setTextColor(Color.parseColor(SUB))
          textSize = 15f
          gravity = Gravity.CENTER
          layoutParams = wrapParams(top = 6)
        }
      )
    }

    root.addView(
      TextView(this).apply {
        text = L("التطبيق محمي", "App locked")
        setTextColor(Color.WHITE)
        textSize = 24f
        typeface = Typeface.DEFAULT_BOLD
        gravity = Gravity.CENTER
        layoutParams = wrapParams(top = 18)
      }
    )

    feedback = TextView(this).apply {
      setTextColor(Color.parseColor(SUB))
      textSize = 15f
      gravity = Gravity.CENTER
      layoutParams = wrapParams(top = 4)
    }
    root.addView(feedback)

    if (method == "pin") {
      root.addView(buildPinUi())
    } else {
      root.addView(buildPatternUi())
    }

    cooldownText = TextView(this).apply {
      setTextColor(Color.parseColor(WARN))
      textSize = 16f
      gravity = Gravity.CENTER
      visibility = View.GONE
      layoutParams = wrapParams(top = 12)
    }
    root.addView(cooldownText)

    setContentView(root)
  }

  private fun wrapParams(top: Int = 0): LinearLayout.LayoutParams =
    LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
      topMargin = dip(top)
      gravity = Gravity.CENTER_HORIZONTAL
    }

  private fun buildPinUi(): View {
    val column = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
    }

    dotsRow = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER
      layoutParams = wrapParams(top = 16)
    }
    val dotCount = pinLength.coerceIn(4, 8)
    repeat(dotCount) {
      val dot = View(this)
      dot.layoutParams = LinearLayout.LayoutParams(dip(14), dip(14)).apply {
        marginStart = dip(5)
        marginEnd = dip(5)
      }
      dot.background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(Color.parseColor(BORDER))
      }
      dotsRow?.addView(dot)
    }
    column.addView(dotsRow)

    val rows = listOf(
      listOf("1", "2", "3"),
      listOf("4", "5", "6"),
      listOf("7", "8", "9"),
      listOf("", "0", "del")
    )
    rows.forEach { keys ->
      val row = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        layoutParams = wrapParams(top = 18)
      }
      keys.forEach { key ->
        if (key.isEmpty()) {
          val spacer = View(this)
          spacer.layoutParams = LinearLayout.LayoutParams(dip(72), dip(72)).apply {
            marginStart = dip(10)
            marginEnd = dip(10)
          }
          row.addView(spacer)
        } else {
          val button = TextView(this).apply {
            text = if (key == "del") "⌫" else key
            setTextColor(Color.parseColor(TEXT))
            textSize = 24f
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
              shape = GradientDrawable.OVAL
              setColor(Color.parseColor(CARD))
              setStroke(dip(1), Color.parseColor(BORDER))
            }
            layoutParams = LinearLayout.LayoutParams(dip(72), dip(72)).apply {
              marginStart = dip(10)
              marginEnd = dip(10)
            }
          }
          button.setOnClickListener {
            if (key == "del") onDelete() else onDigit(key)
          }
          row.addView(button)
        }
      }
      column.addView(row)
    }
    return column
  }

  private fun buildPatternUi(): View {
    val column = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
    }
    column.addView(
      TextView(this).apply {
        text = L("ارسم النمط لفتح التطبيق", "Draw your pattern to unlock")
        setTextColor(Color.parseColor(SUB))
        textSize = 15f
        gravity = Gravity.CENTER
        layoutParams = wrapParams(top = 16)
      }
    )
    patternView = PatternView(this).apply {
      onPatternComplete = { cells -> verify(cells.joinToString(",")) }
      layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dip(300)).apply {
        topMargin = dip(12)
      }
    }
    column.addView(patternView)
    return column
  }

  private fun onDigit(d: String) {
    if (System.currentTimeMillis() < lockoutUntil) return
    if (entry.length >= 8) return
    entry.append(d)
    updateDots(false)
    if (entry.length >= pinLength) {
      verify(entry.toString())
    }
  }

  private fun onDelete() {
    if (System.currentTimeMillis() < lockoutUntil) return
    if (entry.isNotEmpty()) entry.deleteCharAt(entry.length - 1)
    updateDots(false)
  }

  private fun updateDots(error: Boolean) {
    val row = dotsRow ?: return
    for (i in 0 until row.childCount) {
      val dot = row.getChildAt(i)
      val color = when {
        i < entry.length && error -> Color.parseColor(DANGER)
        i < entry.length -> Color.parseColor(ACCENT)
        else -> Color.parseColor(BORDER)
      }
      (dot.background as? GradientDrawable)?.setColor(color)
      dot.invalidate()
    }
  }

  private fun verify(secret: String) {
    if (sha256("$secret|$salt") == expectedHash) {
      feedback.text = L("تم فتح التطبيق", "Unlocked")
      feedback.setTextColor(Color.parseColor(ACCENT2))
      AppLockService.unlock(pkg)
      finish()
    } else {
      onWrongAttempt()
    }
  }

  private fun onWrongAttempt() {
    wrong++
    entry.setLength(0)
    feedback.text = L("محاولة خاطئة", "Wrong code")
    feedback.setTextColor(Color.parseColor(DANGER))
    updateDots(true)
    dotsRow?.let { shake(it) }
    patternView?.markFailed()
    if (wrong >= MAX_ATTEMPTS) startLockout()
  }

  private fun shake(view: View) {
    ObjectAnimator.ofFloat(view, "translationX", 0f, -22f, 22f, -14f, 14f, -6f, 6f, 0f)
      .apply { duration = 400 }
      .start()
  }

  private fun startLockout() {
    lockoutUntil = System.currentTimeMillis() + LOCKOUT_MS
    cooldownText.visibility = View.VISIBLE
    timer?.cancel()
    timer = object : CountDownTimer(LOCKOUT_MS, 500) {
      override fun onTick(millisUntilFinished: Long) {
        val seconds = millisUntilFinished / 1000 + 1
        cooldownText.text = if (isEnglish) {
          "Too many attempts, wait $seconds seconds"
        } else {
          "محاولات كثيرة، انتظر $seconds ثانية"
        }
      }

      override fun onFinish() {
        cooldownText.visibility = View.GONE
        wrong = 0
        lockoutUntil = 0L
        feedback.text = ""
      }
    }.start()
  }

  private val isEnglish: Boolean get() = Prefs.language(this) == "en"

  private fun L(ar: String, en: String): String = if (isEnglish) en else ar

  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {
    // Send the user to the launcher so they don't land in the locked app.
    runCatching {
      startActivity(
        Intent(Intent.ACTION_MAIN)
          .addCategory(Intent.CATEGORY_HOME)
          .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }
    finish()
  }

  override fun onDestroy() {
    timer?.cancel()
    if (isFinishing) isShowing = false
    super.onDestroy()
  }

  private fun sha256(input: String): String {
    val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))
    return bytes.joinToString("") { String.format(Locale.US, "%02x", it.toInt() and 0xFF) }
  }

  companion object {
    const val EXTRA_PKG = "packageName"
    const val MAX_ATTEMPTS = 5
    const val LOCKOUT_MS = 30_000L

    const val BG = "#0B1020"
    const val CARD = "#141C36"
    const val BORDER = "#263159"
    const val TEXT = "#EAF0FF"
    const val SUB = "#8C99B8"
    const val ACCENT = "#4F8CFF"
    const val ACCENT2 = "#22D3A7"
    const val DANGER = "#FF5C7A"
    const val WARN = "#FFC46B"

    @Volatile
    var isShowing = false
  }
}
