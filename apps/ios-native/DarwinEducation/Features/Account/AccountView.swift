import SwiftUI

struct AccountView: View {
    @EnvironmentObject private var sessionStore: SessionStore

    var body: some View {
        List {
            Section("Sessao") {
                Text(sessionStore.session?.user.email ?? "Usuario")
                    .foregroundStyle(.secondary)
            }

            Section {
                Button(role: .destructive) {
                    sessionStore.signOut()
                } label: {
                    Text("Sair")
                }
            }
        }
        .navigationTitle("Conta")
    }
}

#Preview {
    NavigationStack {
        AccountView()
            .environmentObject(SessionStore())
    }
}
