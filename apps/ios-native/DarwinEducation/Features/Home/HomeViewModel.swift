import Foundation

@MainActor
final class HomeViewModel: ObservableObject {
    @Published private(set) var isLoading = false
    @Published private(set) var examsCount = 0
    @Published private(set) var dueDecksCount = 0
    @Published private(set) var masteryPercent = 0.0
    @Published var errorMessage: String?

    private let examsRepository: ExamsRepository
    private let flashcardsRepository: FlashcardsRepository
    private let performanceRepository: PerformanceRepository

    init(
        examsRepository: ExamsRepository,
        flashcardsRepository: FlashcardsRepository,
        performanceRepository: PerformanceRepository
    ) {
        self.examsRepository = examsRepository
        self.flashcardsRepository = flashcardsRepository
        self.performanceRepository = performanceRepository
    }

    func load(accessToken: String?) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            async let exams = examsRepository.listPublicExams(accessToken: accessToken)
            async let decks = flashcardsRepository.listDueDecks(accessToken: accessToken)
            async let performance = performanceRepository.fetchSummary(accessToken: accessToken)

            let (resolvedExams, resolvedDecks, resolvedPerformance) = try await (exams, decks, performance)
            examsCount = resolvedExams.count
            dueDecksCount = resolvedDecks.reduce(0) { $0 + $1.dueCount }
            masteryPercent = resolvedPerformance.masteryPercent
        } catch {
            errorMessage = error.localizedDescription
            examsCount = 0
            dueDecksCount = 0
            masteryPercent = 0
        }
    }
}
