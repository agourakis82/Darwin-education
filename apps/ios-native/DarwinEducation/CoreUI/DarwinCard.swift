import SwiftUI

struct DarwinCard<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(DarwinSpacing.md)
            .background(DarwinMaterial.card)
            .clipShape(RoundedRectangle(cornerRadius: DarwinRadius.lg, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: DarwinRadius.lg, style: .continuous)
                    .stroke(.white.opacity(0.18), lineWidth: 0.8)
            )
            .shadow(color: .black.opacity(0.08), radius: 10, y: 6)
    }
}
