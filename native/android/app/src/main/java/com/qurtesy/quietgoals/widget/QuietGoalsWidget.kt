package com.qurtesy.quietgoals.widget

import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalSize
import androidx.glance.action.actionStartActivity
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.action.clickable
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.qurtesy.quietgoals.MainActivity
import org.json.JSONObject

class QuietGoalsWidget : GlanceAppWidget() {

    companion object {
        val SMALL = DpSize(110.dp, 50.dp)
        val WIDE  = DpSize(250.dp, 50.dp)
        const val PREFS_NAME = "QuietGoalsWidget"
        const val KEY_GOAL   = "active_goal"
    }

    override val sizeMode = SizeMode.Responsive(setOf(SMALL, WIDE))

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json  = prefs.getString(KEY_GOAL, null)

        var goalText = "Tap to set your goal"
        var moodId   = "calm"

        json?.let {
            runCatching {
                val obj = JSONObject(it)
                goalText = obj.optString("text", goalText).ifBlank { goalText }
                moodId   = obj.optString("moodId", moodId)
            }
        }

        val (bg, fg, fgDim) = moodColors(moodId)

        provideContent {
            val isWide = LocalSize.current.width >= 200.dp

            Box(
                modifier = GlanceModifier
                    .fillMaxSize()
                    .background(bg)
                    .clickable(actionStartActivity<MainActivity>())
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Column {
                    Text(
                        text = moodId.replaceFirstChar { it.uppercase() },
                        style = TextStyle(
                            color = ColorProvider(fgDim),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Normal
                        )
                    )
                    Text(
                        text = goalText,
                        maxLines = if (isWide) 2 else 1,
                        style = TextStyle(
                            color = ColorProvider(fg),
                            fontSize = if (isWide) 15.sp else 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    )
                }
            }
        }
    }

    // Returns bg, fg, fg-dimmed for each mood
    private fun moodColors(moodId: String): Triple<Color, Color, Color> = when (moodId) {
        "ambitious" -> Triple(Color(0xFF1A1A1A), Color(0xFFFFFFFF), Color(0x99FFFFFF))
        "grounded"  -> Triple(Color(0xFFFDF6E3), Color(0xFF5D4037), Color(0x995D4037))
        "focused"   -> Triple(Color(0xFFFFFFFF), Color(0xFF111827), Color(0x99111827))
        else        -> Triple(Color(0xFFF0F4F8), Color(0xFF486581), Color(0x99486581)) // calm
    }
}
