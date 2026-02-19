import SwiftUI

struct AccountView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var themeStore: ThemeStore

    var body: some View {
        List {
            Section("Sessao") {
                Text(sessionStore.session?.user.email ?? "Usuario")
                    .foregroundStyle(.secondary)
            }

            Section("Tema") {
                Picker("Aparencia", selection: Binding(
                    get: { themeStore.preference },
                    set: { themeStore.preference = $0 }
                )) {
                    ForEach(ThemePreference.allCases) { option in
                        Label(option.title, systemImage: option.icon).tag(option)
                    }
                }
                .pickerStyle(.segmented)
            }

            Section {
                Button(role: .destructive) {
                    DarwinHaptics.warning()
                    sessionStore.signOut()
                } label: {
                    Text("Sair")
                }
            }
        }
        .navigationTitle("Conta")
        .scrollContentBackground(.hidden)
        .background(AppBackground())
    }
}

#Preview {
    NavigationStack {
        AccountView()
            .environmentObject(SessionStore())
            .environmentObject(ThemeStore())
    }
}
