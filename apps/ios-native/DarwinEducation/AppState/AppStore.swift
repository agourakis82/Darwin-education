import Foundation

@MainActor
final class AppStore: ObservableObject {
    @Published var dependencies: AppDependencies

    init(dependencies: AppDependencies = .live) {
        self.dependencies = dependencies
    }
}
