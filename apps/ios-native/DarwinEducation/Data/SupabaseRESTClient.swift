import Foundation

struct SupabaseRESTClient {
    private let config: AppConfig
    private let httpClient: HTTPClient

    init(config: AppConfig = .shared, httpClient: HTTPClient = HTTPClient()) {
        self.config = config
        self.httpClient = httpClient
    }

    func query<T: Decodable>(
        table: String,
        select: String,
        filters: [URLQueryItem] = [],
        order: String? = nil,
        limit: Int? = nil,
        offset: Int? = nil,
        accessToken: String? = nil,
        decoder: JSONDecoder = JSONDecoder()
    ) async throws -> [T] {
        var items = [URLQueryItem(name: "select", value: select)]
        items.append(contentsOf: filters)
        if let order {
            items.append(URLQueryItem(name: "order", value: order))
        }
        if let limit {
            items.append(URLQueryItem(name: "limit", value: "\(limit)"))
        }
        if let offset {
            items.append(URLQueryItem(name: "offset", value: "\(offset)"))
        }

        let url = try makeURL(path: "/rest/v1/\(table)", queryItems: items)
        let data = try await httpClient.requestData(url, headers: headers(accessToken: accessToken))
        do {
            return try decoder.decode([T].self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    private func makeURL(path: String, queryItems: [URLQueryItem]) throws -> URL {
        guard var components = URLComponents(url: config.supabaseURL.appending(path: path), resolvingAgainstBaseURL: false) else {
            throw APIError.invalidURL
        }
        components.queryItems = queryItems
        guard let url = components.url else {
            throw APIError.invalidURL
        }
        return url
    }

    private func headers(accessToken: String?) -> [String: String] {
        var requestHeaders: [String: String] = [
            "apikey": config.supabaseAnonKey,
            "Authorization": "Bearer \(config.supabaseAnonKey)",
            "Content-Type": "application/json"
        ]

        if let accessToken, !accessToken.isEmpty {
            requestHeaders["Authorization"] = "Bearer \(accessToken)"
        }

        return requestHeaders
    }
}
