import Foundation

@MainActor
final class ExamsViewModel: ObservableObject {
    @Published private(set) var isLoading = false
    @Published private(set) var exams: [ExamSummary] = []
    @Published var errorMessage: String?

    let repository: ExamsRepository

    init(repository: ExamsRepository) {
        self.repository = repository
    }

    func load(accessToken: String?) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            exams = try await repository.listPublicExams(accessToken: accessToken)
        } catch {
            exams = []
            errorMessage = error.localizedDescription
        }
    }
}
