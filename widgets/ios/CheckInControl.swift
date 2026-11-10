import AppIntents
import SwiftUI
import WidgetKit

// Control Center and Lock Screen control (iOS 18+): checks one habit in or
// out for today without opening the app. Merged into the widget extension
// by plugins/with-check-in-control.js, next to WidgetCheckIns.

/// The control's kind, outside the main-actor-isolated control type so the
/// intent can reload it.
private let checkInControlKind = "com.praveenjuge.practice.CheckInControl"

/// A habit the control can be set up with, from the Today widget's list.
@available(iOS 18.0, *)
struct ControlHabit: AppEntity {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Habit"
  static let defaultQuery = ControlHabitQuery()

  var id: String
  var name: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)")
  }
}

@available(iOS 18.0, *)
struct ControlHabitQuery: EntityQuery {
  func entities(for identifiers: [String]) async throws -> [ControlHabit] {
    try await suggestedEntities().filter { identifiers.contains($0.id) }
  }

  func suggestedEntities() async throws -> [ControlHabit] {
    WidgetCheckIns.habits().map { ControlHabit(id: $0.id, name: $0.name) }
  }
}

@available(iOS 18.0, *)
struct SelectHabitConfiguration: ControlConfigurationIntent {
  static let title: LocalizedStringResource = "Choose a Habit"

  @Parameter(title: "Habit")
  var habit: ControlHabit?
}

@available(iOS 18.0, *)
struct SetHabitDoneIntent: SetValueIntent {
  static let title: LocalizedStringResource = "Check In Habit"
  static let isDiscoverable = false

  @Parameter(title: "Habit ID")
  var habitId: String

  @Parameter(title: "Done")
  var value: Bool

  init() {}

  init(habitId: String) {
    self.habitId = habitId
  }

  func perform() async throws -> some IntentResult {
    WidgetCheckIns.setDone(value, habitId: habitId)
    ControlCenter.shared.reloadControls(ofKind: checkInControlKind)
    return .result()
  }
}

@available(iOS 18.0, *)
struct CheckInControlValue {
  let habitId: String
  let name: String
  let done: Bool
}

@available(iOS 18.0, *)
struct CheckInControlProvider: AppIntentControlValueProvider {
  func previewValue(configuration: SelectHabitConfiguration) -> CheckInControlValue {
    CheckInControlValue(
      habitId: configuration.habit?.id ?? "",
      name: configuration.habit?.name ?? "Habit",
      done: false
    )
  }

  func currentValue(configuration: SelectHabitConfiguration) async throws -> CheckInControlValue {
    guard let selected = configuration.habit else {
      return previewValue(configuration: configuration)
    }
    let habit = WidgetCheckIns.habits().first { $0.id == selected.id }
    return CheckInControlValue(
      habitId: selected.id,
      name: habit?.name ?? selected.name,
      done: habit?.done ?? false
    )
  }
}

@available(iOS 18.0, *)
struct CheckInControl: ControlWidget {
  var body: some ControlWidgetConfiguration {
    AppIntentControlConfiguration(kind: checkInControlKind, provider: CheckInControlProvider()) { value in
      ControlWidgetToggle(
        isOn: value.done,
        action: SetHabitDoneIntent(habitId: value.habitId)
      ) {
        Label(value.name, systemImage: "checkmark.circle")
      } valueLabel: { isOn in
        Label(isOn ? "Done" : "Not yet", systemImage: isOn ? "checkmark.circle.fill" : "circle")
      }
      .tint(.green)
    }
    .displayName("Check In Habit")
    .description("Check a habit in for today.")
    .promptsForUserConfiguration()
  }
}
