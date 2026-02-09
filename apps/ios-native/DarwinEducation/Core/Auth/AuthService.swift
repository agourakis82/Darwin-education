import Foundation

protocol AuthService {
    func signIn(email: String, password: String) async throws -> AuthSession
    func refreshSession(refreshToken: String) async throws -> AuthSession
}

struct SupabaseAuthService: AuthService {
    private let config: AppConfig
    private let httpClient: HTTPClient

    init(config: AppConfig = .shared, httpClient: HTTPClient = HTTPClient()) {
        self.config = config
        self.httpClient = httpClient
    }

    func signIn(email: String, password: String) async throws -> AuthSession {
        let endpoint = try makeAuthURL(query: "grant_type=password")
        let payload = SignInPayload(email: email, password: password)
        let body = try JSONEncoder().encode(payload)

        return try await httpClient.request(
            endpoint,
            method: "POST",
            headers: defaultHeaders,
            body: body
        )
    }

    func refreshSession(refreshToken: String) async throws -> AuthSession {
        let endpoint = try makeAuthURL(query: "grant_type=refresh_token")
        let payload = RefreshPayload(refreshToken: refreshToken)
        let body = try JSONEncoder().encode(payload)

        return try await httpClient.request(
            endpoint,
            method: "POST",
            headers: defaultHeaders,
            body: body
        )
    }

    private var defaultHeaders: [String: String] {
        [
            "apikey": config.supabaseAnonKey,
            "Content-Type": "application/json"
        ]
    }

    private func makeAuthURL(query: String) throws -> URL {
        guard let url = URL(string: "\(config.supabaseURL.absoluteString)/auth/v1/token?\(query)") else {
            throw APIError.invalidURL
        }
        return url
    }
}

private struct SignInPayload: Encodable {
    let email: String
    let password: String
}

private struct RefreshPayload: Encodable {
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
        case refreshToken = "refresh_token"
    }
}
