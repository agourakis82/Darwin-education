import Foundation

// MARK: - CDM Profile Response
// Matches the JSON shape of GET /api/cdm/profile/me

struct CDMProfileResponse: Codable {
    var profile: CDMProfile?
    var summary: CDMSummary?
    var warning: String?
}

struct CDMProfile: Codable {
    var latentClass: Int
    var eapEstimate: [Double]
    var mapEstimate: [Bool]
    var posteriorProbabilities: [Double]
    var posteriorEntropy: Double
    var classificationConfidence: Double?
    var masteredAttributes: [String]
    var unmasteredAttributes: [String]
    var attributeBreakdown: [AttributeBreakdown]

    enum CodingKeys: String, CodingKey {
        case latentClass             = "latent_class"
        case eapEstimate             = "eap_estimate"
        case mapEstimate             = "map_estimate"
        case posteriorProbabilities  = "posterior_probabilities"
        case posteriorEntropy        = "posterior_entropy"
        case classificationConfidence = "classification_confidence"
        case masteredAttributes      = "mastered_attributes"
        case unmasteredAttributes    = "unmastered_attributes"
        case attributeBreakdown
    }
}

struct AttributeBreakdown: Codable, Identifiable {
    var id: String
    var labelPt: String
    var eap: Double
    var mastered: Bool
}

struct CDMSummary: Codable {
    var masteredCount: Int
    var unmasteredCount: Int
    var posteriorEntropy: Double
    var classificationConfidence: Double?
    var snapshotAt: String
}

// MARK: - CDM Classify Response
// Matches POST /api/cdm/classify

struct CDMClassifyResponse: Codable {
    var success: Bool?
    var profile: CDMProfile?
    var summary: CDMSummary?
    var error: String?
    var warning: String?
}

// MARK: - CDM Next-Item Response
// Matches GET /api/cdm/next-item

struct CDMNextItemResponse: Codable {
    /// UUID string of the selected question, nil when no more candidates.
    var nextItem: String?
    var currentEntropy: Double?
    var candidatesConsidered: Int?
    var message: String?
    var warning: String?
}
