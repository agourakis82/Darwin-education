import Foundation

// MARK: - Flashcard Due Card
// Matches one element of the `cards` array from GET /api/flashcards/due

struct FlashcardDueCard: Identifiable, Codable {
    let id: String
    let front: String
    let back: String
    let deckId: String
    let deckName: String
    let area: String?
    let topic: String?
    let state: String       // "new" | "learning" | "review"
    let daysPastDue: Int

    enum CodingKeys: String, CodingKey {
        case id, front, back, area, topic, state
        case deckId         = "deckId"
        case deckName       = "deckName"
        case daysPastDue    = "daysPastDue"
    }
}

// MARK: - Due Cards Response
// Top-level wrapper from GET /api/flashcards/due

struct FlashcardDueResponse: Codable {
    var cards: [FlashcardDueCard]
    var total: Int
    var warning: String?
}

// MARK: - Flashcard Review Response
// Matches POST /api/flashcards/review

struct FlashcardReviewResponse: Codable {
    var success: Bool
    var nextReview: String?
    var scheduledDays: Int?
}
