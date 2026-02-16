import Foundation

struct LiveExamsRepository: ExamsRepository {
    private let rest: SupabaseRESTClient

    init(rest: SupabaseRESTClient = SupabaseRESTClient()) {
        self.rest = rest
    }

    func listPublicExams(accessToken: String?) async throws -> [ExamSummary] {
        let rows: [ExamRow] = try await rest.query(
            table: "exams",
            select: "id,title,question_count,time_limit_minutes",
            filters: [URLQueryItem(name: "is_public", value: "eq.true")],
            order: "created_at.desc",
            limit: 30,
            accessToken: accessToken
        )

        return rows.compactMap {
            guard let id = UUID(uuidString: $0.id) else { return nil }
            return ExamSummary(id: id, title: $0.title ?? "Simulado", questionCount: $0.questionCount ?? 0, timeLimitMinutes: $0.timeLimitMinutes ?? 0)
        }
    }

    func fetchExamDetail(examId: String, accessToken: String?) async throws -> ExamDetail {
        let rows: [ExamDetailRow] = try await rest.query(
            table: "exams",
            select: "id,title,question_count,time_limit_minutes,question_ids",
            filters: [URLQueryItem(name: "id", value: "eq.\(examId)")],
            limit: 1,
            accessToken: accessToken
        )
        guard let row = rows.first, let id = UUID(uuidString: row.id) else {
            throw APIError.notFound
        }
        return ExamDetail(
            id: id,
            title: row.title ?? "Simulado",
            questionCount: row.questionCount ?? 0,
            timeLimitMinutes: row.timeLimitMinutes ?? 0,
            questionIds: row.questionIds ?? []
        )
    }

    func fetchQuestions(ids: [String], accessToken: String?) async throws -> [ExamQuestion] {
        let idsParam = "in.(\(ids.joined(separator: ",")))"
        let rows: [QuestionRow] = try await rest.query(
            table: "questions",
            select: "id,stem,options,correct_index,explanation,area,difficulty",
            filters: [URLQueryItem(name: "id", value: idsParam)],
            limit: ids.count,
            accessToken: accessToken
        )
        return rows.compactMap { row in
            guard let id = UUID(uuidString: row.id) else { return nil }
            return ExamQuestion(
                id: id,
                stem: row.stem,
                options: row.options,
                correctIndex: row.correctIndex,
                explanation: row.explanation,
                area: row.area,
                difficulty: row.difficulty
            )
        }
    }
}

struct LiveFlashcardsRepository: FlashcardsRepository {
    private let apiClient: DarwinAPIClient

    init(apiClient: DarwinAPIClient = DarwinAPIClient()) {
        self.apiClient = apiClient
    }

    func listDueDecks(accessToken: String?) async throws -> [DeckSummary] {
        let decks = try await apiClient.fetchDueDecks(accessToken: accessToken)
        return decks.map { DeckSummary(id: UUID(), title: $0.title, dueCount: $0.dueCount) }
    }
}

struct LivePerformanceRepository: PerformanceRepository {
    private let apiClient: DarwinAPIClient

    init(apiClient: DarwinAPIClient = DarwinAPIClient()) {
        self.apiClient = apiClient
    }

    func fetchSummary(accessToken: String?) async throws -> PerformanceSummary {
        let profile = try await apiClient.fetchLearnerProfile(accessToken: accessToken)
        return PerformanceSummary(
            masteryPercent: profile.overallMastery,
            weeklyMinutes: profile.weeklyStudyMinutes,
            answeredQuestions: profile.answeredQuestions
        )
    }
}

struct LiveMedicalContentRepository: MedicalContentRepository {
    private let rest: SupabaseRESTClient

    init(rest: SupabaseRESTClient = SupabaseRESTClient()) {
        self.rest = rest
    }

    func listDiseases(query: String, areaCode: String?, page: Int, pageSize: Int, accessToken: String?) async throws -> [MedicalDiseaseSummary] {
        var filters: [URLQueryItem] = []

        if !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            filters.append(URLQueryItem(name: "search_terms", value: "ilike.*\(query)*"))
        }

        if let areaCode, !areaCode.isEmpty {
            filters.append(URLQueryItem(name: "enamed_area", value: "eq.\(areaCode)"))
        }

        let rows: [DiseaseRow] = try await rest.query(
            table: "medical_diseases",
            select: "id,title,enamed_area,categoria,summary",
            filters: filters,
            order: "title.asc",
            limit: pageSize,
            offset: max((page - 1) * pageSize, 0),
            accessToken: accessToken
        )

        return rows.map {
            MedicalDiseaseSummary(
                id: $0.id,
                title: $0.title,
                areaCode: $0.enamedArea,
                category: $0.category,
                summary: $0.summary ?? ""
            )
        }
    }

    func listMedications(query: String, drugClass: String?, page: Int, pageSize: Int, accessToken: String?) async throws -> [MedicalMedicationSummary] {
        var filters: [URLQueryItem] = []

        if !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            filters.append(URLQueryItem(name: "search_terms", value: "ilike.*\(query)*"))
        }

        if let drugClass, !drugClass.isEmpty {
            filters.append(URLQueryItem(name: "drug_class", value: "eq.\(drugClass)"))
        }

        let rows: [MedicationRow] = try await rest.query(
            table: "medical_medications",
            select: "id,generic_name,drug_class,atc_code,summary",
            filters: filters,
            order: "generic_name.asc",
            limit: pageSize,
            offset: max((page - 1) * pageSize, 0),
            accessToken: accessToken
        )

        return rows.map {
            MedicalMedicationSummary(
                id: $0.id,
                genericName: $0.genericName,
                drugClass: $0.drugClass,
                atcCode: $0.atcCode,
                summary: $0.summary ?? ""
            )
        }
    }
}

private struct ExamRow: Decodable {
    let id: String
    let title: String?
    let questionCount: Int?
    let timeLimitMinutes: Int?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case questionCount = "question_count"
        case timeLimitMinutes = "time_limit_minutes"
    }
}

private struct DiseaseRow: Decodable {
    let id: String
    let title: String
    let enamedArea: String
    let category: String
    let summary: String?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case enamedArea = "enamed_area"
        case category = "categoria"
        case summary
    }
}

private struct MedicationRow: Decodable {
    let id: String
    let genericName: String
    let drugClass: String
    let atcCode: String?
    let summary: String?

    enum CodingKeys: String, CodingKey {
        case id
        case genericName = "generic_name"
        case drugClass = "drug_class"
        case atcCode = "atc_code"
        case summary
    }
}
