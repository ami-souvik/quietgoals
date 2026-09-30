package com.qurtesy.quietgoals.keyboard

import android.widget.FrameLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ThemedReactContext

class NativeKeyboardAvoidingView(context: ThemedReactContext) : FrameLayout(context) {
    init {
        // Initial setup for window insets
        ViewCompat.setOnApplyWindowInsetsListener(this) { _, insets ->
            updateTranslation(insets)
            insets
        }

        // Animate seamlessly with the keyboard
        ViewCompat.setWindowInsetsAnimationCallback(
            this,
            object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_STOP) {
                override fun onProgress(
                    insets: WindowInsetsCompat,
                    runningAnimations: MutableList<WindowInsetsAnimationCompat>
                ): WindowInsetsCompat {
                    updateTranslation(insets)
                    return insets
                }
            }
        )
    }

    private fun updateTranslation(insets: WindowInsetsCompat) {
        val imeHeight = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
        val navBarHeight = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom
        val isImeVisible = insets.isVisible(WindowInsetsCompat.Type.ime())
        
        // Android's IME insets include the navigation bar, so we subtract it
        val offset = if (isImeVisible) {
            Math.max(0, imeHeight - navBarHeight).toFloat()
        } else {
            0f
        }
        
        // Translating the view natively avoids interfering with React Native's Yoga layout engine
        this.translationY = -offset
    }
}

class NativeKeyboardAvoidingViewManager : ViewGroupManager<NativeKeyboardAvoidingView>() {
    override fun getName() = "NativeKeyboardAvoidingView"

    override fun createViewInstance(reactContext: ThemedReactContext): NativeKeyboardAvoidingView {
        return NativeKeyboardAvoidingView(reactContext)
    }
}
