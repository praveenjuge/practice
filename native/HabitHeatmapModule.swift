internal import ExpoModulesCore
internal import ExpoUI
import SwiftUI

// A habit's check-in history as one native SwiftUI view: the whole grid is
// drawn in a Canvas instead of hundreds of separate views. Used inside an
// @expo/ui Host by components/habit-streak-history.ios.tsx.

final class HabitHeatmapViewProps: UIBaseViewProps {
  /// One value per day, a week (7 days) at a time, oldest first:
  /// 0 outside the range, 1 missed, 2 checked in.
  @Field var cells: [Int] = []
  /// A month name for weeks that start a month, "" otherwise.
  @Field var labels: [String] = []
  @Field var accentColor: Color = .green
}

struct HabitHeatmapView: ExpoSwiftUI.View {
  @ObservedObject public var props: HabitHeatmapViewProps

  private let box: CGFloat = 12
  private let gap: CGFloat = 3
  private let labelHeight: CGFloat = 14

  var body: some View {
    let stride = box + gap
    let width = max(CGFloat(props.labels.count) * stride - gap, 0)
    let height = 7 * stride - gap
    let completed = props.cells.filter { $0 == 2 }.count
    let inRange = props.cells.filter { $0 != 0 }.count

    ScrollView(.horizontal, showsIndicators: false) {
      VStack(alignment: .leading, spacing: gap) {
        ZStack(alignment: .topLeading) {
          Color.clear.frame(width: width, height: labelHeight)
          ForEach(Array(props.labels.enumerated()), id: \.offset) { index, label in
            if !label.isEmpty {
              Text(label)
                .font(.system(size: 10))
                .foregroundStyle(.secondary)
                .fixedSize()
                .offset(x: CGFloat(index) * stride)
            }
          }
        }
        Canvas { context, _ in
          let missed = Color(uiColor: .tertiarySystemFill)
          for (index, cell) in props.cells.enumerated() {
            let rect = CGRect(
              x: CGFloat(index / 7) * stride,
              y: CGFloat(index % 7) * stride,
              width: box,
              height: box
            )
            context.opacity = cell == 0 ? 0.5 : 1
            context.fill(
              Path(roundedRect: rect, cornerRadius: 2),
              with: .color(cell == 2 ? props.accentColor : missed)
            )
          }
        }
        .frame(width: width, height: height)
      }
    }
    .defaultScrollAnchor(.trailing)
    .accessibilityElement()
    .accessibilityLabel("Last \(inRange) days of history: \(completed) completed.")
  }
}

final class HabitHeatmapModule: Module {
  func definition() -> ModuleDefinition {
    Name("HabitHeatmapModule")

    ExpoUIView(HabitHeatmapView.self)
  }
}
