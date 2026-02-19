import SwiftUI

struct RootView: View {
    @EnvironmentObject private var sessionStore: SessionStore

    var body: some View {
        Group {
            if sessionStore.isLoading {
                DarwinLoadingView(title: "Carregando sessao...")
            } else if sessionStore.isAuthenticated {
                RootTabView()
            } else {
                LoginView()
            }
        }
        .task {
            await sessionStore.restoreSession()
        }
    }
}

#Preview {
    RootView()
        .environmentObject(SessionStore())
        .environmentObject(AppStore())
        .environmentObject(ThemeStore())
        .environmentObject(FeatureFlagStore())
}
