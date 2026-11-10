import Foundation
import WidgetKit

/// Reads and records habit check-ins in the Today widget's timeline, which
/// lives in the shared app group. The widget's own buttons, Siri and the
/// Control Center control all write here; the app syncs every habit marked
/// `changed` the next time it runs.
///
/// Compiled into both the app (as part of app-intents/) and the widget
/// extension (copied by plugins/with-check-in-control.js), so it only uses
/// Foundation and WidgetKit.
struct WidgetHabit: Sendable {
  let id: String
  let name: String
  let done: Bool
}

enum WidgetCheckIns {
  private static let timelineKey = "__expo_widgets_TodayWidget_timeline"
  private static let progressTimelineKey = "__expo_widgets_ProgressWidget_timeline"

  private static var defaults: UserDefaults? {
    let group = Bundle.main.object(forInfoDictionaryKey: "ExpoWidgetsAppGroupIdentifier") as? String
    return group.flatMap { UserDefaults(suiteName: $0) }
  }

  /// The timeline entry that is showing now: the latest one that has started.
  private static func currentEntryIndex(_ timeline: [[String: Any]]) -> Int? {
    let now = Int(Date().timeIntervalSince1970 * 1000)
    var current: Int?
    for (index, entry) in timeline.enumerated() {
      if let timestamp = entry["timestamp"] as? Int, timestamp <= now {
        current = index
      }
    }
    return current ?? (timeline.isEmpty ? nil : 0)
  }

  /// Today's habits as the widget shows them.
  static func habits() -> [WidgetHabit] {
    guard let timeline = defaults?.array(forKey: timelineKey) as? [[String: Any]],
          let index = currentEntryIndex(timeline),
          let props = timeline[index]["props"] as? [String: Any],
          let habits = props["habits"] as? [[String: Any]] else {
      return []
    }
    return habits.compactMap { habit in
      guard let id = habit["id"] as? String, let name = habit["name"] as? String else {
        return nil
      }
      return WidgetHabit(id: id, name: name, done: habit["done"] as? Bool ?? false)
    }
  }

  /// Marks a habit done (or not) for today in the Today and Progress
  /// widgets. Returns false if the habit isn't in the widgets' list.
  @discardableResult
  static func setDone(_ done: Bool, habitId: String) -> Bool {
    guard let defaults else {
      return false
    }
    var found = false
    for key in [timelineKey, progressTimelineKey] {
      guard var timeline = defaults.array(forKey: key) as? [[String: Any]],
            let index = currentEntryIndex(timeline),
            var props = timeline[index]["props"] as? [String: Any],
            var habits = props["habits"] as? [[String: Any]],
            let habitIndex = habits.firstIndex(where: { $0["id"] as? String == habitId }) else {
        continue
      }
      habits[habitIndex]["done"] = done
      habits[habitIndex]["changed"] = true
      props["habits"] = habits
      timeline[index]["props"] = props
      defaults.set(timeline, forKey: key)
      found = true
    }
    if found {
      WidgetCenter.shared.reloadAllTimelines()
    }
    return found
  }
}
