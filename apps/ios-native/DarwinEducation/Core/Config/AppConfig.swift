import Foundation

struct AppConfig {
    let apiBaseURL: URL
    let supabaseURL: URL
    let supabaseAnonKey: String

    static let shared: AppConfig = {
        do {
            return try AppConfig.loadFromBundle()
        } catch {
            fatalError("Invalid app configuration: \(error.localizedDescription)")
        }
    }()

    private static func loadFromBundle(bundle: Bundle = .main) throws -> AppConfig {
        guard
            let apiBaseURLString = bundle.object(forInfoDictionaryKey: "DarwinAPIBaseURL") as? String,
            let apiBaseURL = URL(string: apiBaseURLString),
            let supabaseURLString = bundle.object(forInfoDictionaryKey: "DarwinSupabaseURL") as? String,
            let supabaseURL = URL(string: supabaseURLString),
            let supabaseAnonKey = bundle.object(forInfoDictionaryKey: "DarwinSupabaseAnonKey") as? String,
            !supabaseAnonKey.isEmpty
        else {
            throw ConfigError.missingRequiredKeys
        }

        return AppConfig(
            apiBaseURL: apiBaseURL,
            supabaseURL: supabaseURL,
            supabaseAnonKey: supabaseAnonKey
        )
    }
}

enum ConfigError: LocalizedError {
    case missingRequiredKeys

    var errorDescription: String? {
        "Missing DarwinAPIBaseURL, DarwinSupabaseURL, or DarwinSupabaseAnonKey in Info.plist."
    }
}
