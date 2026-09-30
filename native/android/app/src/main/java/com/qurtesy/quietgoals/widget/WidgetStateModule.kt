package com.qurtesy.quietgoals.widget

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidgetManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch

class WidgetStateModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WidgetStateModule"

    @ReactMethod
    fun update(goalJson: String) {
        val context: Context = reactContext.applicationContext

        // Persist active goal for the widget to read
        context.getSharedPreferences(QuietGoalsWidget.PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(QuietGoalsWidget.KEY_GOAL, goalJson)
            .apply()

        // Refresh all placed widget instances
        MainScope().launch {
            val manager = GlanceAppWidgetManager(context)
            manager.getGlanceIds(QuietGoalsWidget::class.java).forEach { id ->
                QuietGoalsWidget().update(context, id)
            }
        }
    }
}
