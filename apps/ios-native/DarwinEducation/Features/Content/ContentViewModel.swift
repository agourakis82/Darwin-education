import Foundation

@MainActor
final class ContentViewModel: ObservableObject {
    @Published private(set) var isLoading = false
    @Published private(set) var diseases: [MedicalDiseaseSummary] = []
    @Published private(set) var medications: [MedicalMedicationSummary] = []
    @Published var query = ""
    @Published var errorMessage: String?

    private let repository: MedicalContentRepository

    init(repository: MedicalContentRepository) {
        self.repository = repository
    }

    func load(accessToken: String?) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            async let diseasesTask = repository.listDiseases(query: query, areaCode: nil, page: 1, pageSize: 20, accessToken: accessToken)
            async let medicationsTask = repository.listMedications(query: query, drugClass: nil, page: 1, pageSize: 20, accessToken: accessToken)
            (diseases, medications) = try await (diseasesTask, medicationsTask)
        } catch {
            diseases = []
            medications = []
            errorMessage = error.localizedDescription
        }
    }
}
