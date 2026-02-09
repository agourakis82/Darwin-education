import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var sessionStore: SessionStore

    @State private var email = ""
    @State private var password = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Acesso") {
                    TextField("Email", text: $email)
                        .textContentType(.username)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)

                    SecureField("Senha", text: $password)
                        .textContentType(.password)
                }

                Section {
                    Button {
                        Task {
                            await sessionStore.signIn(email: email, password: password)
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
                    .disabled(email.isEmpty || password.isEmpty || sessionStore.isLoading)
                }

                if let authError = sessionStore.authError {
                    Section("Erro") {
                        Text(authError)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("Darwin Education")
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(SessionStore())
}
