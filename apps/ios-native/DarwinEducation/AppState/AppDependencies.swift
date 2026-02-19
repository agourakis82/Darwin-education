import Foundation

struct AppDependencies {
    let examsRepository: ExamsRepository
    let flashcardsRepository: FlashcardsRepository
    let performanceRepository: PerformanceRepository
    let medicalContentRepository: MedicalContentRepository

    static let live = AppDependencies(
        examsRepository: LiveExamsRepository(),
        flashcardsRepository: LiveFlashcardsRepository(),
        performanceRepository: LivePerformanceRepository(),
        medicalContentRepository: LiveMedicalContentRepository()
    )
}
