import SwiftUI

struct DarwinLoadingView: View {
    let title: String

    var body: some View {
        VStack(spacing: DarwinSpacing.md) {
            ProgressView()
            Text(title)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct DarwinErrorView: View {
    let title: String
    let message: String
    var retryAction: (() -> Void)?

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: "exclamationmark.triangle")
        } description: {
            Text(message)
        } actions: {
            if let retryAction {
                Button("Tentar novamente") {
                    retryAction()
                }
            }
        }
    }
}
