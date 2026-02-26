import Foundation

@MainActor
final class CDMDashboardViewModel: ObservableObject {
    @Published private(set) var profileData: CDMProfileResponse?
    @Published private(set) var isLoading = false
    @Published private(set) var isClassifying = false
    @Published var classifyMessage: String?
    @Published var errorMessage: String?

    private let apiClient: DarwinAPIClient
    var accessToken: String?

    init(apiClient: DarwinAPIClient = DarwinAPIClient(), accessToken: String?) {
        self.apiClient = apiClient
        self.accessToken = accessToken
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            profileData = try await apiClient.fetchCDMProfile(accessToken: accessToken)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func classify() async {
        isClassifying = true
        classifyMessage = nil
        defer { isClassifying = false }

        do {
            let result = try await apiClient.classifyCDM(accessToken: accessToken)
            if result.error != nil {
                classifyMessage = result.error
            } else {
                classifyMessage = "Classificação concluída."
                await load()
            }
        } catch {
            classifyMessage = error.localizedDescription
        }
    }
}
