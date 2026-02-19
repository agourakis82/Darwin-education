import Foundation

@MainActor
final class FlashcardsViewModel: ObservableObject {
    @Published private(set) var isLoading = false
    @Published private(set) var decks: [DeckSummary] = []
    @Published var errorMessage: String?

    private let repository: FlashcardsRepository

    init(repository: FlashcardsRepository) {
        self.repository = repository
    }

    func load(accessToken: String?) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            decks = try await repository.listDueDecks(accessToken: accessToken)
        } catch {
            errorMessage = error.localizedDescription
            decks = []
        }
    }
}
