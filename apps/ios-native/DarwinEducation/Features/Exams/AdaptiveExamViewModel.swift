import Foundation

@MainActor
final class AdaptiveExamViewModel: ObservableObject {
    enum Phase { case setup, loading, question, done }

    // Setup
    @Published var selectedAreas: Set<String> = Set(["clinica_medica", "cirurgia",
        "ginecologia_obstetricia", "pediatria", "saude_coletiva"])
    @Published var minItems: Int = 20
    @Published var maxItems: Int = 60

    // Session
    @Published var phase: Phase = .setup
    @Published private(set) var currentQuestion: ExamQuestion?
    @Published private(set) var itemsAnswered: Int = 0
    @Published private(set) var correctCount: Int = 0
    @Published var errorMessage: String?

    // Answers for review
    @Published private(set) var answeredQuestions: [ExamQuestion] = []
    @Published private(set) var answers: [UUID: Int] = [:]

    private var administeredIds: [String] = []
    private let apiClient: DarwinAPIClient
    private let rest: SupabaseRESTClient
    var accessToken: String?

    init(apiClient: DarwinAPIClient = DarwinAPIClient(),
         rest: SupabaseRESTClient = SupabaseRESTClient(),
         accessToken: String?) {
        self.apiClient = apiClient
        self.rest = rest
        self.accessToken = accessToken
    }

    var areaLabels: [String: String] = [
        "clinica_medica": "Clínica Médica",
        "cirurgia": "Cirurgia",
        "ginecologia_obstetricia": "Ginecologia / Obstetrícia",
        "pediatria": "Pediatria",
        "saude_coletiva": "Saúde Coletiva",
    ]

    // MARK: - Actions

    func start() async {
        phase = .loading
        errorMessage = nil
        administeredIds = []
        itemsAnswered = 0
        correctCount = 0
        answeredQuestions = []
        answers = [:]
        await fetchNextQuestion()
    }

    func answer(_ optionIndex: Int) async {
        guard let question = currentQuestion else { return }

        let isCorrect = optionIndex == question.correctIndex
        answers[question.id] = optionIndex
        answeredQuestions.append(question)
        if isCorrect { correctCount += 1 }
        itemsAnswered += 1

        if itemsAnswered >= maxItems {
            phase = .done
            return
        }

        phase = .loading
        await fetchNextQuestion()
    }

    // MARK: - Private

    private func fetchNextQuestion() async {
        do {
            let nextItemResponse = try await apiClient.fetchCDMNextItem(
                excludeIds: administeredIds,
                accessToken: accessToken
            )

            guard let questionId = nextItemResponse.nextItem else {
                phase = .done
                return
            }

            let questions = try await fetchQuestion(id: questionId)
            guard let question = questions.first else {
                // Try one more item if this one can't be fetched
                administeredIds.append(questionId)
                if administeredIds.count >= maxItems { phase = .done; return }
                await fetchNextQuestion()
                return
            }

            administeredIds.append(questionId)
            currentQuestion = question
            phase = .question
        } catch {
            errorMessage = error.localizedDescription
            if itemsAnswered >= minItems {
                phase = .done
            } else {
                phase = .question // stay on current question if there is one
            }
        }
    }

    private func fetchQuestion(id: String) async throws -> [ExamQuestion] {
        let rows: [QuestionRow] = try await rest.query(
            table: "questions",
            select: "id,stem,options,correct_index,explanation,area,difficulty",
            filters: [URLQueryItem(name: "id", value: "eq.\(id)")],
            limit: 1,
            accessToken: accessToken
        )
        return rows.compactMap { row in
            guard let uuid = UUID(uuidString: row.id) else { return nil }
            return ExamQuestion(
                id: uuid,
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
