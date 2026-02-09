import Foundation

@MainActor
final class PerformanceViewModel: ObservableObject {
    @Published private(set) var isLoading = false
    @Published private(set) var summary = LearnerProfileSummary.placeholder
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
            summary = try await apiClient.fetchLearnerProfile(accessToken: accessToken)
        } catch {
            errorMessage = error.localizedDescription
            summary = .placeholder
        }
    }
}
