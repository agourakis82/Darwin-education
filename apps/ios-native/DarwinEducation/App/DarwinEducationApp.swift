import SwiftUI

@main
struct DarwinEducationApp: App {
    @StateObject private var sessionStore = SessionStore()
    @StateObject private var appStore = AppStore()
    @StateObject private var themeStore = ThemeStore()
    @StateObject private var featureFlagStore = FeatureFlagStore()

    init() {
        DarwinAppearanceConfigurator.configure()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(sessionStore)
                .environmentObject(appStore)
                .environmentObject(themeStore)
                .environmentObject(featureFlagStore)
                .preferredColorScheme(themeStore.preference.colorScheme)
        }
    }
}
