import AppIntents
@preconcurrency import CoreSpotlight
internal import ExpoAppIntents
import Foundation

/// A habit, as Siri, Shortcuts and Spotlight see it. The app publishes the
/// list with `setEntityCatalogAsync('habit', ...)` whenever habits change.
struct HabitEntity: AppEntity, AppIntentEntityRecordConvertible {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Habit"
  static let defaultQuery = HabitQuery()

  var id: String
  @Property(title: "Name")
  var name: String
  var subtitle: String?

  var displayRepresentation: DisplayRepresentation {
    if let subtitle {
      return DisplayRepresentation(title: "\(name)", subtitle: "\(subtitle)")
    }
    return DisplayRepresentation(title: "\(name)")
  }

  init(record: AppIntentEntityRecord) {
    self.id = record.id
    self.name = record.title
    self.subtitle = record.subtitle
  }

  func matches(_ searchText: String) -> Bool {
    let normalize = { (value: String) in
      value
        .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
        .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    let search = normalize(searchText)
    let name = normalize(self.name)
    return !search.isEmpty && (name.contains(search) || search.contains(name))
  }
}

struct HabitQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [HabitEntity] {
    return try await AppIntentEntityStore.shared.entities(ofKind: "habit", matching: identifiers)
      .map(HabitEntity.init(record:))
  }

  func suggestedEntities() async throws -> [HabitEntity] {
    return try await AppIntentEntityStore.shared.entities(ofKind: "habit")
      .map(HabitEntity.init(record:))
  }

  func entities(matching string: String) async throws -> [HabitEntity] {
    return try await suggestedEntities().filter { $0.matches(string) }
  }
}

/// Lets Spotlight index habits, so searching a habit's name offers it.
@available(iOS 18.0, *)
extension HabitEntity: IndexedEntity {
  var attributeSet: CSSearchableItemAttributeSet {
    let attributes = defaultAttributeSet
    attributes.displayName = name
    attributes.title = name
    attributes.contentDescription = subtitle
    attributes.domainIdentifier = "com.praveenjuge.practice.habit"
    attributes.keywords = ["habit", "check in", name]
    return attributes
  }
}

@available(iOS 18.0, *)
extension HabitQuery: EnumerableEntityQuery {
  func allEntities() async throws -> [HabitEntity] {
    return try await suggestedEntities()
  }
}
