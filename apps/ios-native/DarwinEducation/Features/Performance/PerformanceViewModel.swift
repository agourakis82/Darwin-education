import Foundation

@MainActor
final class PerformanceViewModel: ObservableObject {
    @Published private(set) var isLoading = false
    @Published private(set) var summary = PerformanceSummary.empty
    @Published var errorMessage: String?

    private let repository: PerformanceRepository

    init(repository: PerformanceRepository) {
        self.repository = repository
    }

    func load(accessToken: String?) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            summary = try await repository.fetchSummary(accessToken: accessToken)
        } catch {
            errorMessage = error.localizedDescription
            summary = .empty
        }
    }
}
