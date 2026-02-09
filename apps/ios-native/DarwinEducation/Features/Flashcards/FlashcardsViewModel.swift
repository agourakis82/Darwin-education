import Foundation

@MainActor
final class FlashcardsViewModel: ObservableObject {
    @Published private(set) var isLoading = false
    @Published private(set) var decks: [FlashcardDeckSummary] = []
    @Published var errorMessage: String?

    private let apiClient: DarwinAPIClient

    init(apiClient: DarwinAPIClient = DarwinAPIClient()) {
        self.apiClient = apiClient
    }

    func load(accessToken: String?) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            decks = try await apiClient.fetchDueDecks(accessToken: accessToken)
        } catch {
            errorMessage = error.localizedDescription
            decks = []
        }
    }
}
