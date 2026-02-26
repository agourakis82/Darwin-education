import Foundation

@MainActor
final class FlashcardStudyViewModel: ObservableObject {
    enum Phase { case front, back, done }

    @Published private(set) var phase: Phase = .front
    @Published private(set) var currentCard: FlashcardDueCard?
    @Published private(set) var isFlipped = false
    @Published private(set) var isSubmitting = false
    @Published private(set) var reviewedCount = 0
    @Published var errorMessage: String?

    private var queue: [FlashcardDueCard]
    private let apiClient: DarwinAPIClient
    private let accessToken: String?

    init(cards: [FlashcardDueCard], apiClient: DarwinAPIClient = DarwinAPIClient(), accessToken: String?) {
        self.queue = cards
        self.apiClient = apiClient
        self.accessToken = accessToken
        self.currentCard = cards.first
    }

    var remaining: Int { queue.count }

    // MARK: - Actions

    func flip() {
        guard phase == .front else { return }
        withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
            isFlipped = true
            phase = .back
        }
    }

    /// rating: 1=Again, 2=Hard, 3=Good, 4=Easy  (FSRS scale)
    func rate(_ rating: Int) async {
        guard let card = currentCard else { return }
        isSubmitting = true
        defer { isSubmitting = false }

        do {
            try await apiClient.submitFlashcardReview(
                cardId: card.id,
                rating: rating,
                accessToken: accessToken
            )
        } catch {
            // Non-fatal: log but don't block navigation
            errorMessage = error.localizedDescription
        }

        reviewedCount += 1
        advance()
    }

    // MARK: - Private

    private func advance() {
        queue.removeFirst()
        isFlipped = false

        if queue.isEmpty {
            withAnimation { phase = .done }
        } else {
            currentCard = queue.first
            withAnimation { phase = .front }
        }
    }
}
