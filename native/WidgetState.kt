package com.praveenjuge.practice.widgets

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Reads a widget's current props back from expo-widgets' storage, so the app
// can sync check-ins made on the Android widget. expo-widgets exposes this on
// iOS (getTimeline) but not on Android.
class WidgetState : Module() {
  override fun definition() = ModuleDefinition {
    Name("WidgetState")

    Function("readProps") { name: String ->
      val context = appContext.reactContext ?: return@Function null
      context
        .getSharedPreferences("expo.modules.widgets", Context.MODE_PRIVATE)
        .getString("__expo_widgets_${name}_props", null)
    }
  }
}
