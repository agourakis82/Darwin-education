import SwiftUI
import UIKit

struct GlassEffectView: UIViewRepresentable {
    var style: UIBlurEffect.Style = .systemThinMaterial
    var intensity: CGFloat = 1.0

    func makeUIView(context: Context) -> UIVisualEffectView {
        let view = UIVisualEffectView(effect: nil)
        view.clipsToBounds = true
        return view
    }

    func updateUIView(_ uiView: UIVisualEffectView, context: Context) {
        let animator = UIViewPropertyAnimator(duration: 0.2, curve: .linear) {
            uiView.effect = UIBlurEffect(style: style)
        }
        animator.fractionComplete = max(0, min(1, intensity))
        animator.stopAnimation(false)
        animator.finishAnimation(at: .current)
    }
}
