import Foundation

@MainActor
final class ExamDetailViewModel: ObservableObject {
    enum Phase { case info, exam, review }

    @Published private(set) var phase: Phase = .info
    @Published private(set) var isLoading = false
    @Published private(set) var examDetail: ExamDetail?
    @Published private(set) var questions: [ExamQuestion] = []
    @Published var currentIndex = 0
    @Published var answers: [UUID: Int] = [:]
    @Published var errorMessage: String?

    private let repository: ExamsRepository
    let examId: UUID

    init(examId: UUID, repository: ExamsRepository) {
        self.examId = examId
        self.repository = repository
    }

    var currentQuestion: ExamQuestion? {
        guard currentIndex >= 0, currentIndex < questions.count else { return nil }
        return questions[currentIndex]
    }

    var answeredCount: Int { answers.count }

    var correctCount: Int {
        answers.filter { qId, idx in
            questions.first(where: { $0.id == qId })?.correctIndex == idx
        }.count
    }

    func loadDetail(accessToken: String?) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            examDetail = try await repository.fetchExamDetail(
                examId: examId.uuidString, accessToken: accessToken)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func startExam(accessToken: String?) async {
        guard let detail = examDetail else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            questions = try await repository.fetchQuestions(
                ids: detail.questionIds, accessToken: accessToken)
            // Preserve question_ids order
            let orderMap = Dictionary(uniqueKeysWithValues:
                detail.questionIds.enumerated().map { ($0.element, $0.offset) })
            questions.sort {
                (orderMap[$0.id.uuidString.lowercased()] ?? 0) <
                (orderMap[$1.id.uuidString.lowercased()] ?? 0)
            }
            phase = .exam
            currentIndex = 0
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func selectAnswer(_ optionIndex: Int) {
        guard let q = currentQuestion else { return }
        answers[q.id] = optionIndex
    }

    func nextQuestion() {
        if currentIndex < questions.count - 1 { currentIndex += 1 }
    }

    func previousQuestion() {
        if currentIndex > 0 { currentIndex -= 1 }
    }

    func finishExam() {
        phase = .review
        currentIndex = 0
    }
}
