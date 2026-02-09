import Foundation

struct FlashcardDeckSummary: Identifiable {
    let id = UUID()
    let title: String
    let dueCount: Int
}

struct LearnerProfileSummary {
    let overallMastery: Double
    let weeklyStudyMinutes: Int
    let answeredQuestions: Int

    static let placeholder = LearnerProfileSummary(
        overallMastery: 0.0,
        weeklyStudyMinutes: 0,
        answeredQuestions: 0
    )
}
