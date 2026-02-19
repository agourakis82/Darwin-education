import SwiftUI

@MainActor
final class ThemeStore: ObservableObject {
    @AppStorage("darwin.theme.preference") private var preferenceRawValue: String = ThemePreference.system.rawValue

    var preference: ThemePreference {
        get { ThemePreference(rawValue: preferenceRawValue) ?? .system }
        set {
            preferenceRawValue = newValue.rawValue
            objectWillChange.send()
        }
    }
}
