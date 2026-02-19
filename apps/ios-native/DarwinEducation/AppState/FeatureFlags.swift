import Foundation

struct FeatureFlags {
    var useNativeContent: Bool = true
    var useNativeCIP: Bool = true
    var useNativeTrails: Bool = true
    var useSupabaseMedicalContent: Bool = true

    static let `default` = FeatureFlags()
}

@MainActor
final class FeatureFlagStore: ObservableObject {
    @Published var flags: FeatureFlags

    init(flags: FeatureFlags = .default) {
        self.flags = flags
    }
}
