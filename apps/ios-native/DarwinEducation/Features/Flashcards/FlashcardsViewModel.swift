import Foundation

@MainActor
final class FlashcardsViewModel: ObservableObject {
    @Published private(set) var isLoading = false
    @Published private(set) var deckGroups: [FlashcardDeckGroup] = []
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
            let cards = try await apiClient.fetchDueCards(accessToken: accessToken)
            deckGroups = groupByDeck(cards)
        } catch {
            errorMessage = error.localizedDescription
            deckGroups = []
        }
    }

    private func groupByDeck(_ cards: [FlashcardDueCard]) -> [FlashcardDeckGroup] {
        var byDeck: [String: (deckId: String, name: String, cards: [FlashcardDueCard])] = [:]
        for card in cards {
            if byDeck[card.deckId] == nil {
                byDeck[card.deckId] = (card.deckId, card.deckName, [])
            }
            byDeck[card.deckId]!.cards.append(card)
        }
        return byDeck.values
            .map { FlashcardDeckGroup(deckId: $0.deckId, deckName: $0.name, cards: $0.cards) }
            .sorted { $0.deckName < $1.deckName }
    }
}

struct FlashcardDeckGroup: Identifiable {
    var id: String { deckId }
    let deckId: String
    let deckName: String
    let cards: [FlashcardDueCard]
    var dueCount: Int { cards.count }
}
