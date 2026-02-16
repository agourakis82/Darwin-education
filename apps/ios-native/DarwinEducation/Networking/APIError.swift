import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case notFound
    case httpStatus(Int, String)
    case decoding(Error)
    case transport(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL."
        case .invalidResponse:
            return "Invalid response from server."
        case .unauthorized:
            return "Session expired. Please sign in again."
        case .notFound:
            return "Resource not found."
        case let .httpStatus(code, body):
            return "HTTP \(code): \(body)"
        case let .decoding(error):
            return "Decode error: \(error.localizedDescription)"
        case let .transport(error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}
