import Foundation

struct QuestionOption: Codable, Equatable {
    let letter: String
    let text: String
}

struct ExamQuestion: Identifiable, Equatable {
    let id: UUID
    let stem: String
    let options: [QuestionOption]
    let correctIndex: Int
    let explanation: String?
    let area: String?
    let difficulty: String?
}

struct ExamDetail: Identifiable, Equatable {
    let id: UUID
    let title: String
    let questionCount: Int
    let timeLimitMinutes: Int
    let questionIds: [String]
}

// MARK: - Decodable row types for Supabase REST responses

struct ExamDetailRow: Decodable {
    let id: String
    let title: String?
    let questionCount: Int?
    let timeLimitMinutes: Int?
    let questionIds: [String]?

    enum CodingKeys: String, CodingKey {
        case id, title
        case questionCount = "question_count"
        case timeLimitMinutes = "time_limit_minutes"
        case questionIds = "question_ids"
    }
}

struct QuestionRow: Decodable {
    let id: String
    let stem: String
    let options: [QuestionOption]
    let correctIndex: Int
    let explanation: String?
    let area: String?
    let difficulty: String?

    enum CodingKeys: String, CodingKey {
        case id, stem, options, explanation, area, difficulty
        case correctIndex = "correct_index"
    }
}
