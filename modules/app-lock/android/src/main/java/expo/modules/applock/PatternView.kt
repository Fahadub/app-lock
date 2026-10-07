package expo.modules.applock

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.view.MotionEvent
import android.view.View
import kotlin.math.abs
import kotlin.math.min

/** 3x3 pattern drawing view used by the native lock screen. */
class PatternView(context: Context) : View(context) {

  var onPatternComplete: ((List<Int>) -> Unit)? = null

  private val cells = mutableListOf<Int>()
  private var currentX = 0f
  private var currentY = 0f
  private var drawing = false
  private var failed = false

  private val dotIdle = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.parseColor("#3B4A6B") }
  private val dotActive = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.parseColor("#4F8CFF") }
  private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = Color.parseColor("#4F8CFF")
    strokeWidth = 10f
    strokeCap = Paint.Cap.ROUND
    style = Paint.Style.STROKE
  }
  private val lineFail = Paint(linePaint).apply { color = Color.parseColor("#FF5C7A") }

  fun markFailed() {
    failed = true
    invalidate()
    postDelayed({ reset() }, 600)
  }

  fun reset() {
    cells.clear()
    failed = false
    drawing = false
    invalidate()
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    val side = min(width, height).toFloat()
    val cell = side / 3f
    val offX = (width - side) / 2f
    val offY = (height - side) / 2f
    val r = cell * 0.14f

    fun cx(i: Int) = cell * (i % 3) + cell / 2 + offX
    fun cy(i: Int) = cell * (i / 3) + cell / 2 + offY

    for (i in 0 until 9) {
      val active = i in cells
      canvas.drawCircle(cx(i), cy(i), if (active) r * 1.5f else r, if (active) dotActive else dotIdle)
    }

    if (cells.isNotEmpty()) {
      val paint = if (failed) lineFail else linePaint
      var px = cx(cells[0])
      var py = cy(cells[0])
      for (k in 1 until cells.size) {
        canvas.drawLine(px, py, cx(cells[k]), cy(cells[k]), paint)
        px = cx(cells[k])
        py = cy(cells[k])
      }
      if (drawing && !failed) {
        canvas.drawLine(px, py, currentX, currentY, paint)
      }
    }
  }

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(event: MotionEvent): Boolean {
    val side = min(width, height).toFloat()
    val cell = side / 3f
    val offX = (width - side) / 2f
    val offY = (height - side) / 2f
    val trigger = cell * 0.38f

    fun hit(x: Float, y: Float): Int? {
      for (i in 0 until 9) {
        val cxv = cell * (i % 3) + cell / 2 + offX
        val cyv = cell * (i / 3) + cell / 2 + offY
        if (abs(x - cxv) < trigger && abs(y - cyv) < trigger) return i
      }
      return null
    }

    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        reset()
        currentX = event.x
        currentY = event.y
        hit(event.x, event.y)?.let {
          cells.add(it)
          drawing = true
          invalidate()
        }
        return true
      }
      MotionEvent.ACTION_MOVE -> {
        if (drawing) {
          currentX = event.x
          currentY = event.y
          hit(event.x, event.y)?.let {
            if (it !in cells) cells.add(it)
          }
          invalidate()
        }
      }
      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
        if (drawing) {
          drawing = false
          invalidate()
          if (cells.size >= 4) {
            onPatternComplete?.invoke(cells.toList())
          } else {
            reset()
          }
        }
      }
    }
    return true
  }
}
