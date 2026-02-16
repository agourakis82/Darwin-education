import Foundation

protocol ExamsRepository {
    func listPublicExams(accessToken: String?) async throws -> [ExamSummary]
    func fetchExamDetail(examId: String, accessToken: String?) async throws -> ExamDetail
    func fetchQuestions(ids: [String], accessToken: String?) async throws -> [ExamQuestion]
}

protocol FlashcardsRepository {
    func listDueDecks(accessToken: String?) async throws -> [DeckSummary]
}

protocol PerformanceRepository {
    func fetchSummary(accessToken: String?) async throws -> PerformanceSummary
}

protocol MedicalContentRepository {
    func listDiseases(query: String, areaCode: String?, page: Int, pageSize: Int, accessToken: String?) async throws -> [MedicalDiseaseSummary]
    func listMedications(query: String, drugClass: String?, page: Int, pageSize: Int, accessToken: String?) async throws -> [MedicalMedicationSummary]
}
