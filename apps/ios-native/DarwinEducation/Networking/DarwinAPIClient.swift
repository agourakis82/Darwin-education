import Foundation

struct DarwinAPIClient {
    private let config: AppConfig
    private let httpClient: HTTPClient

    init(config: AppConfig = .shared, httpClient: HTTPClient = HTTPClient()) {
        self.config = config
        self.httpClient = httpClient
    }

    func fetchDueDecks(accessToken: String?) async throws -> [FlashcardDeckSummary] {
        let url = try makeURL(path: "/api/flashcards/due")
        let data = try await httpClient.requestData(url, headers: authHeaders(accessToken))
        return try parseDueDecks(from: data)
    }

    func fetchLearnerProfile(accessToken: String?) async throws -> LearnerProfileSummary {
        let url = try makeURL(path: "/api/learner/profile")
        let data = try await httpClient.requestData(url, headers: authHeaders(accessToken))
        return parseLearnerProfile(from: data)
    }

    private func makeURL(path: String) throws -> URL {
        guard let url = URL(string: path, relativeTo: config.apiBaseURL) else {
            throw APIError.invalidURL
        }
        return url
    }

    private func authHeaders(_ accessToken: String?) -> [String: String] {
        guard let accessToken, !accessToken.isEmpty else {
            return ["Content-Type": "application/json"]
        }
        return [
            "Authorization": "Bearer \(accessToken)",
            "Content-Type": "application/json"
        ]
    }

    private func parseDueDecks(from data: Data) throws -> [FlashcardDeckSummary] {
        let root = try JSONSerialization.jsonObject(with: data)

        if let items = root as? [[String: Any]] {
            return normalizeDueDecks(items)
        }

        if
            let dict = root as? [String: Any],
            let items = dict["decks"] as? [[String: Any]]
        {
            return normalizeDueDecks(items)
        }

        if
            let dict = root as? [String: Any],
            let items = dict["data"] as? [[String: Any]]
        {
            return normalizeDueDecks(items)
        }

        return []
    }

    private func normalizeDueDecks(_ items: [[String: Any]]) -> [FlashcardDeckSummary] {
        items.compactMap { item in
            let name = (item["deck_name"] as? String)
                ?? (item["name"] as? String)
                ?? (item["title"] as? String)
                ?? "Deck"

            let dueCount = (item["due_count"] as? Int)
                ?? (item["dueCount"] as? Int)
                ?? (item["count"] as? Int)
                ?? 0

            return FlashcardDeckSummary(title: name, dueCount: dueCount)
        }
    }

    private func parseLearnerProfile(from data: Data) -> LearnerProfileSummary {
        guard let dict = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
            return .placeholder
        }

        let mastery = (dict["overallMastery"] as? Double)
            ?? (dict["mastery"] as? Double)
            ?? 0.0

        let weeklyMinutes = (dict["weeklyStudyMinutes"] as? Int)
            ?? (dict["study_minutes_week"] as? Int)
            ?? 0

        let answered = (dict["answeredQuestions"] as? Int)
            ?? (dict["questions_answered"] as? Int)
            ?? 0

        return LearnerProfileSummary(
            overallMastery: mastery,
            weeklyStudyMinutes: weeklyMinutes,
            answeredQuestions: answered
        )
    }
}
