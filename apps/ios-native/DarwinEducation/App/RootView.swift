import SwiftUI

struct RootView: View {
    @EnvironmentObject private var sessionStore: SessionStore

    var body: some View {
        Group {
            if sessionStore.isLoading {
                ProgressView("Carregando...")
                    .progressViewStyle(.circular)
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
}
