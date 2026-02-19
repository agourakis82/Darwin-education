import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                VStack(spacing: DarwinSpacing.md) {
                    DarwinCard {
                        VStack(alignment: .leading, spacing: DarwinSpacing.md) {
                            Text("Darwin Education")
                                .font(.title2.bold())
                            Text("Acesse com sua conta para sincronizar progresso, simulados e flashcards.")
                                .foregroundStyle(.secondary)

                            TextField("Email", text: $email)
                                .textContentType(.username)
                                .keyboardType(.emailAddress)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled(true)
                                .padding(.horizontal, DarwinSpacing.sm)
                                .padding(.vertical, DarwinSpacing.xs)
                                .background(.thinMaterial)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                            SecureField("Senha", text: $password)
                                .textContentType(.password)
                                .padding(.horizontal, DarwinSpacing.sm)
                                .padding(.vertical, DarwinSpacing.xs)
                                .background(.thinMaterial)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                            Button {
                                DarwinHaptics.tap()
                                Task {
                                    await sessionStore.signIn(email: email, password: password)
                                    if sessionStore.authError == nil {
                                        DarwinHaptics.success()
                                    } else {
                                        DarwinHaptics.error()
                                    }
                                }
                            } label: {
                                if sessionStore.isLoading {
                                    ProgressView()
                                        .frame(maxWidth: .infinity)
                                } else {
                                    Text("Entrar")
                                        .frame(maxWidth: .infinity)
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(DarwinColor.accent)
                            .disabled(email.isEmpty || password.isEmpty || sessionStore.isLoading)
                        }
                    }

                    if let authError = sessionStore.authError {
                        DarwinErrorView(title: "Falha no login", message: authError)
                    }
                }
                .padding(DarwinSpacing.md)
            }
            .navigationTitle("Entrar")
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(SessionStore())
}
