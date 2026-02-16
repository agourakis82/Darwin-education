import Foundation

struct ExamSummary: Identifiable, Equatable, Hashable {
    let id: UUID
    let title: String
    let questionCount: Int
    let timeLimitMinutes: Int
}

struct DeckSummary: Identifiable, Equatable {
    let id: UUID
    let title: String
    let dueCount: Int
}

struct PerformanceSummary: Equatable {
    let masteryPercent: Double
    let weeklyMinutes: Int
    let answeredQuestions: Int

    static let empty = PerformanceSummary(masteryPercent: 0, weeklyMinutes: 0, answeredQuestions: 0)
}

struct MedicalDiseaseSummary: Identifiable, Equatable {
    let id: String
    let title: String
    let areaCode: String
    let category: String
    let summary: String
}

struct MedicalMedicationSummary: Identifiable, Equatable {
    let id: String
    let genericName: String
    let drugClass: String
    let atcCode: String?
    let summary: String
}
