import Foundation

@MainActor
final class SessionStore: ObservableObject {
    @Published private(set) var session: AuthSession?
    @Published private(set) var isLoading = false
    @Published var authError: String?

    private let authService: AuthService
    private let keychain: KeychainStore

    init(
        authService: AuthService = SupabaseAuthService(),
        keychain: KeychainStore = .shared
    ) {
        self.authService = authService
        self.keychain = keychain
    }

    var isAuthenticated: Bool {
        session != nil
    }

    var accessToken: String? {
        session?.accessToken
    }

    func restoreSession() async {
        guard session == nil else { return }

        isLoading = true
        defer { isLoading = false }

        guard let refreshToken = keychain.load(StorageKey.refreshToken.rawValue) else {
            return
        }

        do {
            let refreshed = try await authService.refreshSession(refreshToken: refreshToken)
            setSession(refreshed)
        } catch {
            clearStoredSession()
        }
    }

    func signIn(email: String, password: String) async {
        authError = nil
        isLoading = true
        defer { isLoading = false }

        do {
            let newSession = try await authService.signIn(email: email, password: password)
            setSession(newSession)
        } catch {
            authError = error.localizedDescription
        }
    }

    func signOut() {
        session = nil
        clearStoredSession()
    }

    private func setSession(_ newSession: AuthSession) {
        session = newSession
        _ = keychain.save(newSession.accessToken, for: StorageKey.accessToken.rawValue)
        _ = keychain.save(newSession.refreshToken, for: StorageKey.refreshToken.rawValue)
    }

    private func clearStoredSession() {
        keychain.delete(StorageKey.accessToken.rawValue)
        keychain.delete(StorageKey.refreshToken.rawValue)
    }
}

private enum StorageKey: String {
    case accessToken = "access_token"
    case refreshToken = "refresh_token"
}
