import AppIntents
internal import ExpoAppIntents
internal import ExpoModulesCore

/// "Check in Meditate in Practice". Runs without opening the app: the
/// check-in is recorded in the widgets' shared storage (the widgets update
/// right away) and synced to the server the next time the app runs. If the
/// app is running, it also gets the invocation and syncs at once.
struct CheckInHabitIntent: AppIntent {
  static let title: LocalizedStringResource = "Check In Habit"
  static let description = IntentDescription("Marks a habit as done for today.")
  static let openAppWhenRun: Bool = false

  @Parameter(title: "Habit", requestValueDialog: "Which habit?")
  var habit: HabitEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Check in \(\.$habit)")
  }

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    WidgetCheckIns.setDone(true, habitId: habit.id)
    await AppIntentDispatcher.shared.dispatch(
      name: "checkInHabit",
      params: ["habitId": .string(habit.id)]
    )
    return .result(dialog: "Checked in \(habit.name).")
  }
}

/// Lets the app donate in-app check-ins with
/// `donateIntentAsync('checkInHabit', { habitId })`, so the system can
/// suggest the habit on the Lock Screen and in Spotlight.
extension CheckInHabitIntent: DonatableAppIntent {
  struct DonationParams: Record {
    @Field(.required) var habitId: String = ""
  }

  final class UnknownHabitException: GenericException<String>, @unchecked Sendable {
    override var reason: String {
      return "Habit '\(param)' isn't in the published 'habit' catalog."
    }
  }

  init(donationParams: DonationParams) async throws {
    self.init()
    guard let habit = try await HabitQuery().entities(for: [donationParams.habitId]).first else {
      throw UnknownHabitException(donationParams.habitId)
    }
    self.habit = habit
  }
}

struct AppShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: CheckInHabitIntent(),
      phrases: [
        "Check in \(\.$habit) in \(.applicationName)",
        "Mark \(\.$habit) done in \(.applicationName)",
        "Log \(\.$habit) in \(.applicationName)",
        "Check in a habit in \(.applicationName)",
      ],
      shortTitle: "Check In",
      systemImageName: "checkmark.circle"
    )
  }
}
